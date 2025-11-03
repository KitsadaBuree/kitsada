// src/app/(dasboard)/dashboard/orders_done/page.jsx
"use client";
import { useEffect, useMemo, useState } from "react";

/* fetch helper */
async function safeJsonFetch(url, init) {
  const r = await fetch(url, { cache: "no-store", ...init });
  const ct = r.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  if (!r.ok) {
    if (isJson) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || `HTTP ${r.status}`);
    }
    throw new Error(`HTTP ${r.status} – ไม่พบปลายทางหรือมีข้อผิดพลาด`);
  }
  if (!isJson) throw new Error("Bad content-type");
  return r.json();
}

/* icons */
const IconReceipt = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2v20l3-2 3 2 3-2 3 2V2z" />
    <path d="M8 6h8M8 10h8M8 14h6" />
  </svg>
);
const IconClock = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const IconCheck = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 7l-9 9-4-4" />
  </svg>
);
const IconShield = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10z" />
  </svg>
);

/* Member cell */
function MemberCell({ row }) {
  const name =
    row.member_name ||
    row.customer_name ||
    row.user_fullname ||
    row.user_name ||
    row.name ||
    "-";

  const email =
    row.member_email ||
    row.customer_email ||
    row.user_email ||
    row.email ||
    "";

  return (
    <div className="min-w-0">
      <div className="truncate">{name}</div>
      {email && <div className="text-xs text-slate-400 truncate">{email}</div>}
    </div>
  );
}

export default function OrdersDonePage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  // load ที่รับ AbortSignal (เผื่อยกเลิกตอน debounce)
  const load = async (signal) => {
    try {
      setErr("");
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("payment", "CHECKING"); // โชว์เฉพาะที่รอตรวจสอบ

      const res = await safeJsonFetch(`/api/orders_done?${params.toString()}`, { signal });
      if (res.ok) setItems(res.items || []);
    } catch (e) {
      if (e?.name === "AbortError") return; // ถูกยกเลิก ไม่ต้องโชว์ error
      setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    }
  };

  // ✅ ค้นหาอัตโนมัติด้วย debounce 350ms (รวมทั้งครั้งแรก) และ dependency *คงที่เสมอ* เป็น [q]
  useEffect(() => {
    const ctr = new AbortController();
    const h = setTimeout(() => load(ctr.signal), 350);
    return () => {
      ctr.abort();
      clearTimeout(h);
    };
  }, [q]);

  const totalSum = useMemo(
    () => items.reduce((s, it) => s + Number(it.total || 0), 0),
    [items]
  );

  const GUTTER = "px-4 md:px-6";

  function StatusBadge({ payment }) {
    const v = String(payment || "").toUpperCase();
    if (v === "PAID") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200" title="ชำระแล้ว">
          <IconCheck className="h-3.5 w-3.5" /> จ่ายแล้ว
        </span>
      );
    }
    if (v === "CHECKING") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-700 ring-1 ring-sky-200" title="รอตรวจสอบ">
          <IconShield className="h-3.5 w-3.5" /> รอตรวจสอบ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700 ring-1 ring-amber-200" title="รอชำระเงิน">
        <IconClock className="h-3.5 w-3.5" /> รอชำระ
      </span>
    );
  }

  return (
    <div className={`w-full max-w-none ${GUTTER} pt-4 pb-6 space-y-5`}>
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white shadow-sm">
            <IconReceipt className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">ออเดอร์ที่รอตรวจสอบการชำระ</h1>
            <p className="mt-1 text-sm text-slate-600">
              ทั้งหมด {items.length} รายการ · ยอดรวม ฿{totalSum.toFixed(2)}
            </p>
          </div>
        </div>

        {/* กล่องค้นหา — ไม่มีสปิน/ปุ่มแล้ว */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา: เลขออเดอร์/เลขโต๊ะ"
            className="w-64 outline-none text-sm"
          />
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {/* ตาราง */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur text-slate-600 shadow-[inset_0_-1px_0_rgba(0,0,0,.05)]">
              <tr>
                <th className="py-3 px-3 md:px-4 text-left first:pl-4 md:first:pl-6">Order#</th>
                <th className="py-3 px-3 md:px-4 text-left">โต๊ะ</th>
                <th className="py-3 px-3 md:px-4 text-left">สมาชิก</th>
                <th className="py-3 px-3 md:px-4 text-left">เวลา</th>
                <th className="py-3 px-3 md:px-4 text-center">สถานะชำระ</th>
                <th className="py-3 px-3 md:px-4 text-right">ยอดรวม</th>
                <th className="py-3 px-3 md:px-4 text-center last:pr-4 md:last:pr-6">เปิดดู</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 md:px-4 py-10 text-center text-slate-500" colSpan={7}>
                    ยังไม่มีออเดอร์ที่รอตรวจสอบการชำระ
                  </td>
                </tr>
              )}

              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 md:px-4 first:pl-4 md:first:pl-6 font-mono text-xs text-slate-600">
                    {it.order_code}
                  </td>
                  <td className="py-3 px-3 md:px-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
                      โต๊ะ {it.table_no}
                    </span>
                    <div className="mt-1 text-xs text-slate-500">{it.items_count} เมนู</div>
                  </td>
                  <td className="py-3 px-3 md:px-4">
                    <MemberCell row={it} />
                  </td>
                  <td className="py-3 px-3 md:px-4 whitespace-nowrap text-slate-700">
                    {new Date(it.closed_at).toLocaleString("th-TH", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-3 md:px-4 text-center">
                    <StatusBadge payment={it.payment_status} />
                  </td>
                  <td className="py-3 px-3 md:px-4 text-right tabular-nums">
                    ฿{Number(it.total || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 md:px-4 text-center last:pr-4 md:last:pr-6">
                    <a
                      href={`/dashboard/orders_done/${it.id}`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      รายละเอียด
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
