"use client";
import { useEffect, useRef, useState } from "react";
import StaffTable from "./StaffTable";
import StaffFormModal from "./StaffFormModal";
import ConfirmDialog from "./ConfirmDialog";
import { Plus, Users } from "lucide-react";

export default function StaffClient() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [role, setRole] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: "desc" });

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [askDel, setAskDel] = useState(null);

  // debounce ค้นหา
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // ---- โหลดข้อมูลแบบ cancel ได้ ----
  const ctrRef = useRef(null);
  async function load() {
    // ยกเลิกคำขอเก่า (ถ้ามี)
    ctrRef.current?.abort();
    const ctr = new AbortController();
    ctrRef.current = ctr;

    setLoading(true);
    try {
      const url = new URL("/api/staff", location.origin);
      if (debouncedQ) url.searchParams.set("q", debouncedQ);
      if (role) url.searchParams.set("role", role);
      url.searchParams.set("sort", `${sort.key}:${sort.dir}`);

      const res = await fetch(url, { cache: "no-store", signal: ctr.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => null);
      if (ctr.signal.aborted) return; // ถูกยกเลิก
      setRows(json?.data || []);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        setRows([]);
      }
    } finally {
      if (!ctr.signal.aborted) setLoading(false);
    }
  }
  useEffect(() => { load(); }, [debouncedQ, role, sort]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg ring-1 ring-white/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">จัดการพนักงาน</h1>
              <p className="text-slate-500 text-sm">
                ทั้งหมด {rows.length.toLocaleString()} รายการ · ค้นหา/กรอง/แก้ไข/ลบ
              </p>
            </div>
          </div>

          <button
            onClick={() => { setEditing(null); setOpenForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white shadow hover:bg-orange-600"
          >
            <Plus className="h-5 w-5" /> เพิ่มพนักงาน
          </button>
        </div>

        <div className="mt-6">
          <StaffTable
            data={rows}
            loading={loading}
            q={q}
            role={role}
            sort={sort}
            onChangeQuery={({ q: qq, role: r }) => {
              if (qq !== undefined) setQ(qq);
              if (r !== undefined) setRole(r);
            }}
            onChangeSort={setSort}
            onEdit={(row) => { setEditing(row); setOpenForm(true); }}
            onDelete={(row) => setAskDel(row)}
          />
        </div>
      </div>

      {/* ใส่ key เพื่อรีเซ็ตฟอร์มเมื่อสลับ record/new */}
      <StaffFormModal
        key={editing?.id || "new"}
        open={openForm}
        editing={editing}
        onClose={() => setOpenForm(false)}
        onSaved={async () => {
          await load();
          setOpenForm(false);
        }}
      />

      <ConfirmDialog
        open={!!askDel}
        title="ยืนยันการลบพนักงาน"
        desc={askDel ? `ต้องการลบ “${askDel.name}” หรือไม่?` : ""}
        onCancel={() => setAskDel(null)}
        onConfirm={async () => {
          try {
            const res = await fetch(`/api/staff/${askDel.id}`, {
              method: "DELETE",
              cache: "no-store",
            });
            const json = await res.json().catch(() => null);
            if (!json?.ok) throw new Error(json?.error || "ลบไม่สำเร็จ");
            await load();
          } catch (e) {
            alert(e.message || "ลบไม่สำเร็จ");
          } finally {
            setAskDel(null); // ปิด dialog เสมอ
          }
        }}
      />
    </div>
  );
}
