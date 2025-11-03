// app/(dashboard)/orders/page.jsx
"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, Filter, Clock, CheckCircle2, XCircle, Banknote,
  CircleAlert, Eye, ReceiptText,
} from "lucide-react";

async function safeJsonFetch(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error((await r.text().catch(()=>"")) || `HTTP ${r.status}`);
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new Error("Bad content-type");
  return r.json();
}

/* --- Badges --- */
function StatusBadge({ value }) {
  const v = String(value || "").toLowerCase();
  const map = {
    pending:  { label: "กำลังดำเนินการ", cls: "bg-amber-50 text-amber-700 ring-amber-200", Icon: Clock },
    doing:    { label: "กำลังทำ",         cls: "bg-yellow-50 text-yellow-700 ring-yellow-200", Icon: Clock },
    ready:    { label: "พร้อมเสิร์ฟ",      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: CheckCircle2 },
    done:     { label: "เสร็จสิ้น",        cls: "bg-slate-100 text-slate-700 ring-slate-200", Icon: CheckCircle2 },
    canceled: { label: "ยกเลิก",          cls: "bg-rose-50 text-rose-700 ring-rose-200", Icon: XCircle },
  };
  const { label, cls, Icon } = map[v] || { label: value, cls: "bg-slate-100 text-slate-700 ring-slate-200", Icon: CircleAlert };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1 ${cls}`}>
      <Icon size={14} />{label}
    </span>
  );
}
function PayBadge({ value }) {
  const v = String(value || "").toUpperCase();
  const map = {
    UNPAID:   { label: "ยังไม่ชำระ",   cls: "bg-slate-100 text-slate-700 ring-slate-200", Icon: CircleAlert },
    CHECKING: { label: "กำลังตรวจสอบ", cls: "bg-amber-50 text-amber-700 ring-amber-200",  Icon: Clock },
    PAID:     { label: "ชำระแล้ว",     cls: "bg-sky-50 text-sky-700 ring-sky-200",         Icon: Banknote },
    PARTIAL:  { label: "ชำระบางส่วน",  cls: "bg-indigo-50 text-indigo-700 ring-indigo-200", Icon: Banknote },
    FAILED:   { label: "ชำระล้มเหลว",   cls: "bg-rose-50 text-rose-700 ring-rose-200",     Icon: XCircle },
  };
  const { label, cls, Icon } = map[v] || { label: value, cls: "bg-slate-100 text-slate-700 ring-slate-200", Icon: CircleAlert };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1 ${cls}`}>
      <Icon size={14} />{label}
    </span>
  );
}

export default function OrdersPage() {
  const [items, setItems]   = useState([]);
  const [q, setQ]           = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage]     = useState(1);
  const [pageSize]          = useState(20);
  const [total, setTotal]   = useState(0);
  const [err, setErr]       = useState("");
  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    try {
      loadingRef.current = true;
      setErr("");
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        hidePaid: "1",
      });
      if (q) params.set("q", q);
      if (status) params.set("status", status);

      const res = await safeJsonFetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const list = (res.items || []).filter(
          (o) => String(o.payment_status).toUpperCase() !== "PAID"
        );
        setItems(list);
        setTotal(Number(res.total ?? list.length ?? 0));
      }
    } catch (e) {
      setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      loadingRef.current = false;
    }
  }, [page, pageSize, q, status]);

  useEffect(() => { load(); }, [page, pageSize, status, load]);

  // ค้นหาอัตโนมัติ (debounce) และรองรับกด Enter
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 350);
    return () => clearTimeout(t);
  }, [q, load]);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-3 flex flex-col gap-3 md:mb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white shadow-sm">
            <ReceiptText size={18} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">ออเดอร์ทั้งหมด</h1>
            <p className="mt-1 text-sm text-orange-700/80">
              ทั้งหมด {total.toLocaleString("th-TH")} รายการ
            </p>
          </div>
        </div>

        {/* Controls (ไม่มีปุ่มค้นหาแล้ว) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหา: เลขออเดอร์ / โต๊ะ / สถานะ / ชำระเงิน"
              className="h-10 w-80 rounded-xl border border-orange-200/60 bg-white px-4 pr-16 shadow-sm
                         focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
              onKeyDown={(e)=>{ if (e.key === "Enter") { setPage(1); load(); } }}
            />
            {/* ปุ่มล้างค่า */}
            <button
              onClick={() => setQ("")}
              className={`absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 ${q ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              aria-label="ล้าง"
              type="button"
            >
              ×
            </button>
            <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-orange-500/70" />
          </div>

          <div className="relative">
            <Filter size={16} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-orange-500/70" />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-orange-200/60 bg-white pl-8 pr-8 shadow-sm
                         focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
            >
              <option value="">ทุกสถานะ</option>
              <option value="pending">กำลังดำเนินการ</option>
              <option value="doing">กำลังทำ</option>
              <option value="ready">พร้อมเสิร์ฟ</option>
              <option value="done">เสร็จสิ้น</option>
              <option value="canceled">ยกเลิก</option>
            </select>
          </div>
        </div>
      </div>

      {err && (
        <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-red-700 ring-1 ring-red-200">
          {err}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Order#</th>
                <th className="px-4 py-3 text-left">โต๊ะ</th>
                <th className="px-4 py-3 text-center">จำนวน</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">จ่ายเงิน</th>
                <th className="px-4 py-3 text-left">เวลา</th>
                <th className="px-4 py-3 text-center">เปิดดู</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((o, idx) => (
                <tr key={o.id} className={`text-slate-800 hover:bg-slate-50 ${idx % 2 ? "bg-slate-50/30" : ""}`}>
                  <td className="px-4 py-3 align-middle font-mono text-slate-600">{o.order_code || o.id}</td>
                  <td className="px-4 py-3 align-middle">{o.table_no || "—"}</td>
                  <td className="px-4 py-3 align-middle text-center tabular-nums">{o.items_count ?? 0}</td>
                  <td className="px-4 py-3 align-middle text-center"><StatusBadge value={o.status} /></td>
                  <td className="px-4 py-3 align-middle text-center"><PayBadge value={o.payment_status} /></td>
                  <td className="px-4 py-3 align-middle text-slate-500">
                    {o.created_at ? new Date(o.created_at).toLocaleString("th-TH") : "—"}
                  </td>
                  <td className="px-4 py-3 align-middle text-center">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      <Eye size={16} />
                      รายละเอียด
                    </Link>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={7}>
                    ไม่พบออเดอร์
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-2 border-t bg-slate-50 px-4 py-3">
          <div className="text-sm text-slate-500">ทั้งหมด {total.toLocaleString("th-TH")} รายการ</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-slate-700 shadow-sm disabled:opacity-50"
            >
              ← ก่อนหน้า
            </button>
            <div className="min-w-[120px] text-center text-sm text-slate-600">
              หน้า {page} / {pages}
            </div>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-slate-700 shadow-sm disabled:opacity-50"
            >
              ถัดไป →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
