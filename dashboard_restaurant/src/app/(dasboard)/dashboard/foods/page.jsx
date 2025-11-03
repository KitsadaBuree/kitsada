// app/(dasboard)/dashboard/foods/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FoodsHeader from "../../../../../components/foods/FoodsHeader";
import FoodsToolbar from "../../../../../components/foods/FoodsToolbar";
import FoodTable from "../../../../../components/foods/FoodTable";
import FoodModal from "../../../../../components/foods/FoodModal";
import ConfirmDelete from "../../../../../components/foods/ConfirmDelete";
import ServiceChargeModal from "../../../../../components/foods/ServiceChargeModal";

async function safeJson(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`Expected JSON but got: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export default function FoodsPage() {
  const [items, setItems] = useState([]);
  const [svc, setSvc] = useState(0);
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState(""); // string: "", "1", ...
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [svcModalOpen, setSvcModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const reqSeq = useRef(0); // ใช้กัน stale response

  /* ---------- Load categories (ครั้งแรก + หลัง CRUD เพื่ออัปเดต count) ---------- */
  const loadCategories = useMemo(
    () => async (signal) => {
      const data = await safeJson(
        await fetch("/api/foods/categories?withCount=1", { cache: "no-store", signal })
      );
      setCategories(data.categories || []);
    },
    []
  );

  /* ---------- Load foods + service charge (ด้วย AbortController + debounce) ---------- */
  const load = useMemo(
    () => async (signal) => {
      const qs = new URLSearchParams({ q, cat: catId || "" }).toString();
      const [foods, sc] = await Promise.all([
        safeJson(await fetch(`/api/foods?${qs}`, { cache: "no-store", signal })),
        safeJson(await fetch(`/api/settings/service-charge`, { cache: "no-store", signal })),
      ]);
      setItems(foods.items || []);
      setSvc(sc.rate ?? 0);
    },
    [q, catId]
  );

  // ensure categories ก่อนเปิด modal เพิ่ม/แก้ไข
  const ensureCategories = async () => {
    if (!categories || categories.length === 0) {
      const controller = new AbortController();
      try {
        await loadCategories(controller.signal);
      } finally {
        controller.abort();
      }
    }
  };

  // initial load
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErrMsg("");
    (async () => {
      try {
        await Promise.all([load(controller.signal), loadCategories(controller.signal)]);
      } catch (e) {
        setErrMsg(e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ครั้งแรกเท่านั้น

  // react to q / catId (debounce + abort previous + กัน stale)
  useEffect(() => {
    const seq = ++reqSeq.current;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setErrMsg("");
      try {
        await load(controller.signal);
      } catch (e) {
        if (seq === reqSeq.current) setErrMsg(e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (seq === reqSeq.current) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [load]);

  return (
    <div className="p-6 space-y-4">
      <FoodsHeader serviceRate={svc} onEditServiceRate={() => setSvcModalOpen(true)} />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-visible">
        <FoodsToolbar
          q={q}
          onChangeQ={setQ}
          catId={catId}
          onChangeCatId={(v) => setCatId(v ?? "")}
          categories={categories}
          onAdd={async () => {
            await ensureCategories();
            setModal({ mode: "create" });
          }}
        />

        <FoodTable
          items={items}
          loading={loading}
          error={errMsg}
          onEdit={async (item) => {
            await ensureCategories();
            setModal({ mode: "edit", item });
          }}
          onDelete={(id) => setDel({ id })}
        />
      </div>

      {/* create / edit */}
      {modal && (
        <FoodModal
          data={modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            // รีโหลดทั้งรายการและหมวดหมู่เพื่อให้ count ถูกต้อง
            const controller = new AbortController();
            try {
              await load(controller.signal);
              await loadCategories(controller.signal);
            } finally {
              controller.abort();
            }
          }}
        />
      )}

      {/* delete */}
      {del && (
        <ConfirmDelete
          id={del.id}
          onCancel={() => setDel(null)}
          onOK={async () => {
            await fetch(`/api/foods/${del.id}`, { method: "DELETE" });
            setDel(null);
            const controller = new AbortController();
            try {
              await load(controller.signal);
              await loadCategories(controller.signal);
            } finally {
              controller.abort();
            }
          }}
        />
      )}

      {/* service charge */}
      <ServiceChargeModal
        open={svcModalOpen}
        defaultRate={svc}
        onClose={() => setSvcModalOpen(false)}
        onSave={async (newRate) => {
          // optimistic (เร็ว) + ยืนยันด้วยค่าจริงจาก server
          try {
            await safeJson(
              await fetch("/api/settings/service-charge", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rate: newRate }),
              })
            );
            const fresh = await safeJson(
              await fetch("/api/settings/service-charge", { cache: "no-store" })
            );
            setSvc(fresh.rate ?? newRate);
          } catch (e) {
            // ถ้าตั้งค่าไม่สำเร็จ ก็แค่ปิด modal และคงค่าเดิม
            console.error(e);
          } finally {
            setSvcModalOpen(false);
          }
        }}
      />
    </div>
  );
}
