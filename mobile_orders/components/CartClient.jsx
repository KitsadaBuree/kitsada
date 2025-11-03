// components/CartClient.jsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

const KEY = "cart_v1";
const fmtTHB = n =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(n || 0));

async function postOrder(items, tableNo = "", note = "") {
  const payload = {
    tableNo,
    note,
    items: items.map(i => ({ id: i.id, qty: i.qty, note: i.note || "" })),
  };
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let json;
  try { json = await res.json(); } catch { throw new Error(`HTTP ${res.status}`); }
  if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json.data; // { orderId, orderCode, ... }
}

export default function CartClient({
  initialItems = [],
  serviceRate = 0,       // ✅ รับจาก props (เช่น 0.045 = 4.5%)
  onCloseHref = "/",
}) {
  const router = useRouter();

  const [items, setItems] = useState(
    initialItems.map(it => ({ ...it, qty: it.qty ?? 1 }))
  );
  const [tableNo, setTableNo] = useState("");
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState("");

  // ---------- Toast ----------
  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({ show:false, type:"success", title:"", desc:"" });
  const openToast = (type, title, desc = "") => {
    setToast({ show: true, type, title, desc });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(s => ({ ...s, show: false }));
    }, 2400);
  };
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  // ---------- Confirm Delete Modal ----------
  const [confirmDel, setConfirmDel] = useState({ open:false, id:null, note:"", name:"" });
  const askRemove = (id, note = "", name = "") => setConfirmDel({ open:true, id, note:note||"", name });
  const doRemove = () => {
    setItems(arr => arr.filter(
      it => !(Number(it.id) === Number(confirmDel.id) && (it.note || "") === (confirmDel.note || ""))
    ));
    setConfirmDel({ open:false, id:null, note:"", name:"" });
    openToast("success","ลบรายการแล้ว", confirmDel.name || "");
  };
  useEffect(() => {
    if (!confirmDel.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [confirmDel.open]);

  // โหลดเลขโต๊ะจาก QR (?t=...) หรือจาก localStorage
  useEffect(() => {
    (async () => {
      try {
        const saved = typeof window !== "undefined" ? localStorage.getItem("table_name") : "";
        if (saved) setTableNo(saved);

        const t = typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("t")
          : null;

        if (t) {
          const res = await fetch(`/api/table?code=${encodeURIComponent(t)}`, { cache: "no-store" });
          const json = await res.json();
          if (json?.ok && json.data) {
            const name = String(json.data.name);
            setTableNo(name);
            localStorage.setItem("table_code", t);
            localStorage.setItem("table_id", String(json.data.id));
            localStorage.setItem("table_name", name);
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    setItems(initialItems.map(it => ({ ...it, qty: it.qty ?? 1 })));
  }, [initialItems]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  // === คำนวณยอดรวม ===
  const subTotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0),
    [items]
  );
  const service = subTotal * (serviceRate || 0);                   // ✅ ใช้ serviceRate จาก props
  const grandTotal = subTotal + service;
  const count = items.reduce((n, it) => n + Number(it.qty), 0);

  // === Actions ===
  const inc = (id, note = "") =>
    setItems(arr => arr.map(it =>
      Number(it.id) === Number(id) && (it.note || "") === (note || "")
        ? { ...it, qty: Math.min(Number(it.qty) + 1, 99) }
        : it
    ));
  const dec = (id, note = "") =>
    setItems(arr => arr.map(it =>
      Number(it.id) === Number(id) && (it.note || "") === (note || "")
        ? { ...it, qty: Math.max(Number(it.qty) - 1, 1) }
        : it
    ));

  async function handlePlace() {
    try {
      setPlacing(true); setErr("");
      if (!items.length) throw new Error("ไม่มีสินค้าในตะกร้า");
      if (!tableNo) throw new Error("กรุณาเลือก/สแกนเลขโต๊ะก่อน");

      const data = await postOrder(items, tableNo, "");

      try {
        localStorage.setItem("last_order_code", data.orderCode);
        localStorage.setItem("last_order_id", String(data.orderId));
        const hist = JSON.parse(localStorage.getItem("order_history") || "[]");
        const next = [data.orderCode, ...hist.filter(c => c !== data.orderCode)];
        localStorage.setItem("order_history", JSON.stringify(next.slice(0, 20)));
      } catch {}

      localStorage.removeItem(KEY);
      setItems([]);

      openToast("success", "สั่งอาหารสำเร็จ", `หมายเลขออเดอร์ ${data.orderCode}`);
      setTimeout(() => { router.replace(`/orders/${encodeURIComponent(data.orderCode)}`); }, 300);
    } catch (e) {
      const msg = e.message || "สั่งอาหารไม่สำเร็จ";
      setErr(msg);
      openToast("error", "สั่งอาหารไม่สำเร็จ", msg);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: "#E9E9EB" }}>
        <div className="relative h-14 max-w-screen-sm mx-auto flex items-center justify-center">
          <a href={onCloseHref} className="absolute left-2 p-3 rounded-xl hover:bg-slate-100" aria-label="ปิด">
            <X className="w-6 h-6 text-slate-800" />
          </a>
          <h1 className="text-xl font-semibold text-slate-800">ตะกร้าสินค้า</h1>
        </div>
      </header>

      {/* List */}
      <main className="max-w-screen-sm mx-auto w-full flex-1 pt-2">
        {items.map((it, idx) => (
          <div key={`${it.id}.-${it.note || ""}`} className="px-4">
            <div className="mt-3 rounded-2xl bg-white px-4 py-3 border shadow-[0_4px_12px_rgba(0,0,0,0.05)]" style={{ borderColor: "#E9E9EB" }}>
              <div className="flex items-start gap-4">
                <div className="w-20 aspect-square rounded-xl bg-slate-200 grid place-items-center shrink-0 overflow-hidden">
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover rounded-2xl"
                         onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  ) : <div className="w-full h-full bg-slate-300" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[17px] font-semibold text-slate-800 leading-tight truncate">{it.name}</p>
                      <p className="text-slate-400 text-sm">ID {String(it.id)}</p>
                      {it.note && <p className="mt-1 text-[13px] text-slate-500 line-clamp-2">หมายเหตุ: {it.note}</p>}
                    </div>
                    <p className="text-slate-900 font-semibold [font-variant-numeric:tabular-nums] tracking-[0.01em]">
                      {fmtTHB(it.price)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => dec(it.id, it.note || "")} className="w-8 h-8 rounded-lg border grid place-items-center active:scale-95" style={{ borderColor: "#E9E9EB" }} aria-label="ลดจำนวน">−</button>
                      <span className="min-w-6 text-center font-semibold [font-variant-numeric:tabular-nums]">{it.qty}</span>
                      <button onClick={() => inc(it.id, it.note || "")} className="w-8 h-8 rounded-lg border grid place-items-center active:scale-95" style={{ borderColor: "#E9E9EB" }} aria-label="เพิ่มจำนวน">+</button>
                    </div>

                    <button onClick={() => askRemove(it.id, it.note || "", it.name)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 active:scale-95" aria-label="ลบรายการ" title="ลบรายการ">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {idx !== items.length - 1 && <div className="mt-3 mb-1 h-px bg-slate-100" />}
          </div>
        ))}

        {!items.length && (
          <div className="px-4 py-10 text-center text-slate-500">ยังไม่มีสินค้าในตะกร้า</div>
        )}
      </main>

      {/* Summary / Bottom */}
      <div className="sticky bottom-0 z-50 bg-white border-t" style={{ borderColor: "#E9E9EB" }}>
        <div className="max-w-screen-sm mx-auto w-full px-4 pt-4 pb-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}>
          <div className="flex items-center justify-between text-[15px] text-slate-400">
            <span>เลขโต๊ะ</span>
            <span className="[font-variant-numeric:tabular-nums]">{tableNo || "-"}</span>
          </div>
          <div className="flex items-center justify-between text-[15px] text-slate-400">
            <span>service charge</span>
            <span className="[font-variant-numeric:tabular-nums]">
              {(Number(serviceRate || 0) * 100).toFixed(2)}%
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg text-slate-700">{count} รายการ</span>
            <span className="text-2xl font-extrabold [font-variant-numeric:tabular-nums] tracking-[0.01em] text-slate-900">
              รวม {fmtTHB(grandTotal)}
            </span>
          </div>

          {err && <div className="mt-2 text-rose-600 text-sm">{err}</div>}

          <button
            onClick={handlePlace}
            disabled={placing || items.length === 0 || !tableNo}
            className="mt-3 w-full h-14 rounded-2xl text-white text-[18px] font-semibold shadow-[0_-6px_12px_rgba(0,0,0,0.06)] hover:opacity-95 active:translate-y-[0.5px] transition disabled:opacity-60"
            style={{ background: "#F4935E" }}
          >
            {placing ? "กำลังสั่ง..." : "สั่งอาหาร"}
          </button>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDel.open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="del-title">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDel(s => ({ ...s, open: false }))} />
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div className="w-[92%] max-w-sm rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 p-6">
              <div className="w-20 h-20 rounded-2xl bg-rose-50 mx-auto grid place-items-center mb-4">
                <Trash2 className="w-10 h-10 text-rose-500" />
              </div>
              <h3 id="del-title" className="text-xl font-semibold text-slate-900 text-center">ลบรายการนี้?</h3>
              {confirmDel.name && <p className="mt-2 text-center text-slate-500">{confirmDel.name}</p>}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button className="rounded-2xl py-3 font-semibold border" style={{ borderColor: "#E9E9EB", color: "#374151" }} onClick={() => setConfirmDel(s => ({ ...s, open: false }))}>
                  ยกเลิก
                </button>
                <button className="rounded-2xl py-3 font-semibold text-white" style={{ background: "#EF4444" }} onClick={doRemove}>
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-sm rounded-2xl px-4 py-3 text-white shadow-lg ring-1 ring-black/10 backdrop-blur transition-all duration-300
                    ${toast.show ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"}
                    ${toast.type === "success" ? "bg-emerald-500/90" : "bg-rose-500/90"}`}
        style={{ top: "calc(env(safe-area-inset-top) + 16px)" }}
      >
        <div className="flex items-start gap-3">
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold leading-tight">{toast.title}</p>
            {toast.desc && <p className="text-sm opacity-90">{toast.desc}</p>}
          </div>
          <button onClick={() => setToast(s => ({ ...s, show: false }))} className="opacity-80 hover:opacity-100" aria-label="ปิดแจ้งเตือน">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
