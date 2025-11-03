"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Eye, History,
  Download, RefreshCw, Receipt, X
} from "lucide-react";

/* ============ utils ============ */
const fmtTHB = (n) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" })
    .format(Number(n || 0));

async function safeJsonFetch(url, init) {
  const r = await fetch(url, { cache: "no-store", ...init });
  const t = await r.text().catch(() => "");
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  try { return JSON.parse(t); } catch { throw new Error("Bad JSON"); }
}

function shiftDate(baseIso, g, step) {
  const dt = new Date(baseIso);
  if (g === "day")   dt.setDate(dt.getDate() + step);
  if (g === "month") dt.setMonth(dt.getMonth() + step, 1);
  if (g === "year")  dt.setFullYear(dt.getFullYear() + step, 1);
  const yyyy = dt.getFullYear();
  const mm   = String(dt.getMonth() + 1).padStart(2, "0");
  const dd   = String(dt.getDate()).padStart(2, "0");
  if (g === "day")   return `${yyyy}-${mm}-${dd}`;
  if (g === "month") return `${yyyy}-${mm}-01`;
  return `${yyyy}-01-01`;
}

function BE(dateIso) {
  if (!dateIso) return "-";
  const txt = new Date(dateIso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  return txt.replace(/\u200f/g, "");
}

/* ========= helper: รองรับหลายคีย์สำหรับข้อมูลสมาชิก ========= */
function pickMember(order = {}) {
  const m = order.member || order.user || {};
  const name =
    m.name ??
    m.fullName ??
    order.member_name ??
    order.memberName ??
    order.customer_name ??
    "";
  const email =
    m.email ??
    order.member_email ??
    order.memberEmail ??
    order.customer_email ??
    "";
  return { name, email };
}

/* ============ pretty chips ============ */
const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
      active
        ? "bg-orange-600 text-white ring-orange-500 shadow-sm"
        : "bg-white text-slate-700 ring-slate-200 hover:bg-orange-50"
    }`}
  >
    {children}
  </button>
);

/* ============ Bill Modal ============ */
function BillModal({ open, onClose, order, settingsRate }) {
  if (!open || !order) return null;

  const {
    id, order_code, table_no,
    payment_status, payment_method,
    created_at, closed_at, paid_at,
    items = [],
    subtotal = 0, service_rate = null, service_charge = 0, discount = 0,
    total = 0,
  } = order;

  // ⬅️ NEW: ดึงข้อมูลสมาชิก (รองรับหลายคีย์)
  const { name: mName, email: mEmail } = pickMember(order);

  // service rate: ใช้จากบิลก่อน ถ้าไม่มีใช้จาก settings (ดิบ ไม่เติม %)
  const rawServiceRate = service_rate ?? settingsRate ?? "";

  const StatusChip = ({ v }) => {
    const s = String(v || "").toUpperCase();
    const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ring-1";
    if (s === "PAID")     return <span className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200`}>ชำระแล้ว</span>;
    if (s === "CHECKING") return <span className={`${base} bg-sky-50 text-sky-700 ring-sky-200`}>รอตรวจสอบ</span>;
    return <span className={`${base} bg-amber-50 text-amber-700 ring-amber-200`}>รอชำระ</span>;
  };

  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-700">{label}</span>
      <span className="tabular-nums text-slate-800">{children}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="relative border-b">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1400px_300px_at_-10%_-40%,rgba(253,88,0,.12),transparent_60%),radial-gradient(800px_200px_at_110%_120%,rgba(16,185,129,.10),transparent_60%)]" />
          <div className="relative flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white shadow ring-1 ring-orange-400/60">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <div className="text-base font-semibold tracking-tight text-slate-900">รายละเอียดบิล</div>
                <div className="text-xs text-slate-500">
                  รหัส: {order_code || `#${id}`} • โต๊ะ {table_no || "-"}
                </div>
                {/* ⬅️ NEW: แถบแสดงสมาชิกใต้หัวข้อ */}
                {(mName || mEmail) && (
                  <div className="mt-1 text-xs text-slate-600">
                    สมาชิก: <span className="font-medium text-slate-800">{mName || "-"}</span>
                    {mEmail && <> • <span className="text-slate-700">{mEmail}</span></>}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-5 p-5 md:grid-cols-2">
          {/* Left: รายการอาหาร */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-slate-900 font-semibold">รายการอาหารที่สั่ง ({items.length})</div>
              {items.length > 0 && <div className="text-xs text-slate-500">จำนวน × ราคา</div>}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/60 shadow-sm">
              {items.length ? items.map((it) => {
                const unit = Number(it.unit_price ?? it.price ?? 0);
                const qty  = Number(it.qty || 0);
                const line = unit * qty;
                return (
                  <div key={it.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-0">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-800">{it.name}</div>
                      <div className="text-xs text-slate-500">x{qty} · {unit}</div>
                    </div>
                    <div className="tabular-nums font-medium text-slate-800">{line} บาท</div>
                  </div>
                );
              }) : (
                <div className="grid place-items-center gap-2 px-6 py-14 text-slate-400">ไม่มีรายการ</div>
              )}
            </div>
          </div>

          {/* Right: ชำระเงิน + สรุปยอด */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">การชำระเงิน</div>
                <StatusChip v={payment_status} />
              </div>

              {/* ⬅️ NEW: กล่องข้อมูลสมาชิก (ซ่อนอัตโนมัติถ้าไม่มี) */}
              {(mName || mEmail) && (
                <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs ring-1 ring-slate-200">
                  <div className="font-medium text-slate-700">ข้อมูลสมาชิก</div>
                  <div className="text-slate-600">
                    ชื่อ: <span className="text-slate-800">{mName || "-"}</span>
                    {mEmail && <> • อีเมล: <span className="text-slate-800">{mEmail}</span></>}
                  </div>
                </div>
              )}

              <Row label="วิธีชำระ">{payment_method || "-"}</Row>
              <div className="mt-2 grid gap-1 text-xs text-slate-500">
                <div>เปิดบิล: {BE(created_at)}</div>
                <div>ปิดบิล: {BE(closed_at)}</div>
                <div>ชำระเมื่อ: {BE(paid_at)}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-700">สรุปยอด</div>

              {/* อัตราค่าบริการ แสดงตัวเลขดิบ */}
              {rawServiceRate !== "" && <Row label="Service Charge">{rawServiceRate} %</Row>}

              <Row label="รวมค่าอาหาร">{subtotal}</Row>
              <Row label="ค่าบริการ">{service_charge}</Row>
              {Number(discount) > 0 && <Row label="ส่วนลด">-{discount}</Row>}

              <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

              <div className="flex items-end justify-between">
                <div className="text-lg font-semibold text-slate-900">ราคารวม</div>
                <div className="text-3xl font-bold text-orange-600 tabular-nums">{total}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t bg-slate-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm hover:bg-slate-100"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ main page ============ */
export default function OrderHistoryPage() {
  const [granularity, setGranularity] = useState("day");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==== โมดัลบิล ====
  const [billOpen, setBillOpen] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [billOrder, setBillOrder] = useState(null);
  const [settingsRate, setSettingsRate] = useState(null); // ใช้เป็น fallback ถ้าบิลไม่มี service_rate

  // summary
  const totalAmount = useMemo(
    () => rows.reduce((s, r) => s + (r.total || 0), 0),
    [rows]
  );

  // ดึง history จาก API เดิม
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ granularity, date }).toString();
      const res = await safeJsonFetch(`/api/reports/summary?${q}`);
      const list = res?.data?.history || [];
      setRows(list.map(h => ({
        id: h.id,
        order_code: h.order_code ?? h.id,
        table: h.table ?? "-",
        date: h.date ? BE(h.date) : "-",
        total: Number(h.total ?? 0),
      })));
    } finally {
      setLoading(false);
    }
  }, [granularity, date]);

  useEffect(() => { load(); }, [load]);

  // เปิดบิล: โหลดรายละเอียดบิล + ถ้าไม่มี service_rate ให้ดึงจาก settings
  const openBill = useCallback(async (id) => {
    setBillOpen(true);
    setBillLoading(true);
    setBillOrder(null);
    try {
      const r = await safeJsonFetch(`/api/orders_done/${id}`);
      const data = r?.data || { id };

      // ถ้าในบิลไม่มี service_rate -> ลองดึงจาก /api/settings
      if (data.service_rate == null) {
        try {
          const s = await safeJsonFetch(`/api/settings`);
          setSettingsRate(s?.data?.service_rate ?? null);
        } catch {
          setSettingsRate(null);
        }
      } else {
        setSettingsRate(null);
      }

      setBillOrder(data);
    } catch (e) {
      setBillOrder({ id, error: e.message });
    } finally {
      setBillLoading(false);
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl p-6 space-y-6">
      {/* ===== Header ===== */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
        <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-600 text-white shadow ring-1 ring-orange-500/60">
            <History className="h-5 w-5" />
          </span>
          <div className="mr-auto">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              ประวัติการสั่งซื้อ
            </h1>
            <p className="text-xs text-slate-600">
              ดูออเดอร์ย้อนหลังตามวัน/เดือน/ปี • ใช้ข้อมูลจากรายงานสรุป (API เดิม)
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Chip active={granularity==="day"} onClick={()=>setGranularity("day")}>วัน</Chip>
            <Chip active={granularity==="month"} onClick={()=>setGranularity("month")}>เดือน</Chip>
            <Chip active={granularity==="year"} onClick={()=>setGranularity("year")}>ปี</Chip>

            <button
              className="rounded-xl border border-orange-200 bg-white p-2 shadow-sm hover:bg-orange-50"
              onClick={()=> setDate(shiftDate(date, granularity, -1))}
              aria-label="ก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4 text-orange-600" />
            </button>

            <span className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm shadow-sm">
              <CalendarDays className="h-4 w-4 text-orange-600" />
              {granularity!=="year" ? (
                <input
                  type={granularity==="day" ? "date" : "month"}
                  value={granularity==="day" ? date : date.slice(0,7)}
                  onChange={(e)=>{
                    const v = e.target.value;
                    setDate(granularity==="day" ? v : `${v}-01`);
                  }}
                  className="outline-none"
                />
              ) : (
                <input
                  type="number" min="2000" max="2100"
                  value={date.slice(0,4)}
                  onChange={(e)=> setDate(`${e.target.value}-01-01`)}
                  className="w-[88px] outline-none"
                />
              )}
            </span>

            <button
              className="rounded-xl border border-orange-200 bg-white p-2 shadow-sm hover:bg-orange-50"
              onClick={()=> setDate(shiftDate(date, granularity, +1))}
              aria-label="ถัดไป"
            >
              <ChevronRight className="h-4 w-4 text-orange-600" />
            </button>

            <button
              onClick={load}
              className="ml-1 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-orange-50"
            >
              <RefreshCw className="h-4 w-4 text-orange-600" /> รีเฟรช
            </button>
          </div>
        </div>
      </div>

      {/* ===== Top summary cards ===== */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-orange-100/60 blur-2xl transition group-hover:scale-110" />
          <div className="text-slate-500">จำนวนบิล</div>
          <div className="mt-1 text-4xl font-semibold tabular-nums text-slate-900">{rows.length}</div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl transition group-hover:scale-110" />
          <div className="text-slate-500">ยอดรวมช่วงที่เลือก</div>
          <div className="mt-1 text-4xl font-semibold tabular-nums text-emerald-600">
            {fmtTHB(totalAmount)}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-500">รูปแบบเวลา</div>
          <div className="mt-1 text-lg font-medium text-slate-900">
            {granularity==="day"?"รายวัน":granularity==="month"?"รายเดือน":"รายปี"}
          </div>
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="rounded-3xl border border-orange-200/70 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="font-semibold text-slate-900">รายการย้อนหลัง</div>
          <button
            onClick={()=>{
              const header = ["order_code","table","date","total"];
              const lines = [
                header.join(","),
                ...rows.map(r => [r.order_code, r.table, r.date, r.total].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(","))
              ];
              const blob = new Blob([`\ufeff${lines.join("\n")}`], { type:"text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `order_history_${granularity}_${date}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="mb-2 inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-orange-50"
          >
            <Download className="h-4 w-4 text-orange-600" /> ส่งออก CSV
          </button>
        </div>

        <div className="mx-5 mb-4 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-orange-50/80 backdrop-blur">
              <tr className="text-slate-700">
                <th className="px-4 py-2 text-left">โต๊ะ</th>
                <th className="px-4 py-2 text-left">วัน/เดือน/ปี</th>
                <th className="px-4 py-2 text-right">ยอดรวม</th>
                <th className="px-4 py-2 text-center">บิล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_,i)=>(
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 w-16 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-48 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3 text-right"><div className="ml-auto h-3 w-24 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3 text-center"><div className="mx-auto h-8 w-24 rounded bg-slate-200" /></td>
                  </tr>
                ))
              ) : rows.length ? (
                rows.map((h) => (
                  <tr key={h.id} className="group hover:bg-orange-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">โต๊ะ: {h.table}</td>
                    <td className="px-4 py-3 text-slate-700">{h.date}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtTHB(h.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openBill(h.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
                      >
                        <Eye className="h-4 w-4 text-orange-600" />
                        รายละเอียด
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-12">
                    <div className="grid place-items-center gap-2 text-slate-400">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100">🧾</div>
                      ยังไม่มีข้อมูลในช่วงนี้
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill modal & veil */}
      <BillModal open={billOpen} onClose={() => setBillOpen(false)} order={billOrder} settingsRate={settingsRate} />
      {billOpen && billLoading && (
        <div className="fixed inset-0 z-[65] grid place-items-center bg-black/20">
          <div className="rounded-xl bg-white px-4 py-2 text-slate-700 shadow">กำลังโหลดบิล…</div>
        </div>
      )}
    </div>
  );
}
