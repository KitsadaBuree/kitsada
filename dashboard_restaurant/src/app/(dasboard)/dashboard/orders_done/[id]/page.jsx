"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ReceiptText, Clock, CheckCircle2,
  Banknote, CreditCard, Smartphone, X, ShieldCheck
} from "lucide-react";

/* ---------------- helpers ---------------- */
const fmtTHB = (n) =>
  Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function safeJsonFetch(url, init) {
  const r = await fetch(url, { cache: "no-store", ...init });
  const t = await r.text().catch(() => "");
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  try { return JSON.parse(t); } catch { throw new Error("Bad JSON"); }
}

function formatOrderCode(code, fallback = "-") {
  const s = String(code || "");
  if (!s) return fallback;
  return s.length > 4 ? `${s.slice(0, -4)}–${s.slice(-4)}` : s;
}

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
      <defs><linearGradient id='g' x1='0' x2='1'><stop stop-color='#f1f5f9'/><stop offset='1' stop-color='#e2e8f0'/></linearGradient></defs>
      <rect width='100%' height='100%' rx='14' fill='url(#g)'/>
      <circle cx='48' cy='40' r='10' fill='#cbd5e1'/>
      <rect x='24' y='58' width='48' height='10' rx='5' fill='#cbd5e1'/>
    </svg>`
  );

/* ---------------- tiny ui parts ---------------- */
function CookingStatusPill({ value }) {
  const v = String(value || "").toLowerCase();
  const map = {
    served:  { label: "เสิร์ฟแล้ว",  cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: CheckCircle2 },
    ready:   { label: "พร้อมเสิร์ฟ",  cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: CheckCircle2 },
    doing:   { label: "กำลังทำ",      cls: "bg-amber-50  text-amber-700  ring-amber-200",    Icon: Clock },
    pending: { label: "กำลังทำ",      cls: "bg-amber-50  text-amber-700  ring-amber-200",    Icon: Clock },
  };
  const cfg = map[v] || map.doing;
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1 ${cfg.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const v = String(status || "").toUpperCase();
  if (v === "PAID") {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
        ชำระแล้ว
      </span>
    );
  }
  if (v === "CHECKING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-sky-700 ring-1 ring-sky-200">
        <ShieldCheck className="h-3.5 w-3.5" /> รอตรวจสอบ
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700 ring-1 ring-amber-200">
      รอชำระ
    </span>
  );
}

const SoftDivider = () => (
  <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200/70 to-transparent" />
);

/* ---------------- Confirm Dialog ---------------- */
function ConfirmDialog({
  open, title, message, confirmText = "ยืนยัน", cancelText = "ยกเลิก",
  onConfirm, onClose, loading,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm md:backdrop-blur-lg p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="px-4 pt-4 pb-2">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{message}</div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t bg-slate-50 px-4 py-3">
          <button onClick={onClose} className="rounded-xl border bg-white px-4 py-2 text-slate-700 hover:bg-slate-100">
            {cancelText}
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2 text-white shadow-sm ring-1 ring-rose-400/60 hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "กำลังดำเนินการ…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Payment Modal ---------------- */
function PaymentModal({ open, defaultAmount, onClose, onSubmit, loading }) {
  const [method, setMethod] = useState("CASH");
  useEffect(() => { setMethod("CASH"); }, [defaultAmount]);
  if (!open) return null;

  // CASH และ QR
  const methods = [
    { val: "CASH", label: "เงินสด", Icon: Banknote },
    { val: "QR",   label: "โอน/QR", Icon: Smartphone },
  ];

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm md:backdrop-blur-lg p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">ชำระเงิน</div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <div className="mb-1 text-sm text-slate-600">จำนวนเงิน</div>
            <input
              value={fmtTHB(defaultAmount)}
              readOnly
              aria-readonly="true"
              title="ยอดที่ต้องชำระถูกล็อกตามยอดรวม"
              className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-lg shadow-sm"
            />
            <div className="mt-1 text-xs text-slate-400">ยอดที่ต้องชำระ: ฿{fmtTHB(defaultAmount)}</div>
          </div>

          <div>
            <div className="mb-2 text-sm text-slate-600">วิธีชำระ</div>
            {/* เหลือ 2 ปุ่ม ปรับ grid-cols-2 */}
            <div className="grid grid-cols-2 gap-2">
              {methods.map(({ val, label, Icon }) => (
                <button
                  key={val}
                  onClick={() => setMethod(val)}
                  className={
                    "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm shadow-sm " +
                    (method === val
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
                  }
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-slate-50 px-4 py-3">
          <button onClick={onClose} className="rounded-xl border bg-white px-4 py-2 text-slate-700 hover:bg-slate-100">
            ยกเลิก
          </button>
          <button
            disabled={loading}
            onClick={() => onSubmit?.({ method, amount: Number(defaultAmount) || 0 })}
            className="rounded-xl bg-orange-600 px-4 py-2 text-white shadow-sm ring-1 ring-orange-400/60 hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก…" : "บันทึกการชำระ"}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ---------------- page ---------------- */
export default function OrderDetailPage({ params }) {
  const { id: idRaw } = use(params);
  const id = Number(idRaw);
  const idOk = Number.isFinite(id) && id > 0;

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [serviceRateState, setServiceRateState] = useState(0); // เก็บค่า serviceRate เผื่อ API รายการส่งมา
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // payment states
  const [payOpen, setPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [toast, setToast] = useState("");

  // confirm-cancel payment states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (!idOk) { setErr("bad id"); setLoading(false); return; }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      setErr("");
      setLoading(true);

      // ดึงหัวออเดอร์ (ควรได้ subtotal, service_rate, service_charge, discount, total, payment_status)
      const o = await safeJsonFetch(`/api/orders/${id}`, { signal: ac.signal });
      if (o.ok) setOrder(o.order || o.item || null);

      // ดึงรายการ (บางระบบแนบ service_rate มากับ endpoint นี้)
      const it = await safeJsonFetch(`/api/orders/${id}/items`, { signal: ac.signal });
      if (it.ok) {
        setItems(it.items || []);
        setServiceRateState(Number(it.service_rate ?? 0));
      }
    } catch (e) {
      if (e.name !== "AbortError") setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [id, idOk]);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  // ===== เงิน: ยึดตาม DB เป็นหลัก =====
  // 1) ค่าที่มากับหัวออเดอร์
  const dbSubtotal       = Number(order?.subtotal ?? 0);
  const dbServiceRatePct = Number(order?.service_rate ?? serviceRateState ?? 0); // percent
  const dbServiceCharge  = Number(order?.service_charge ?? 0);
  const dbDiscount       = Number(order?.discount ?? 0);
  const dbTotal          = Number.isFinite(Number(order?.total)) ? Number(order?.total) : null;

  // 2) fallback ถ้า DB ไม่มี subtotal -> รวมจากรายการ
  const itemsSubtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.price ?? it.unit_price ?? 0) * Number(it.qty || 0), 0),
    [items]
  );

  const subtotal = dbSubtotal || itemsSubtotal;
  const serviceRate = dbServiceRatePct;
  const service = dbServiceCharge || +(subtotal * (serviceRate / 100)).toFixed(2);
  const discount = dbDiscount;

  // 3) grand total: ใช้ total จาก DB ถ้ามี ไม่งั้นคำนวณเอง
  const grand = dbTotal !== null ? dbTotal : +(subtotal + service - discount).toFixed(2);

  const paymentStatus = String(order?.payment_status || "").toUpperCase();

  // --- payment handlers ---
  async function postJSON(url, body) {
    return safeJsonFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  }
  async function delJSON(url) {
    return safeJsonFetch(url, { method: "DELETE", credentials: "include" });
  }

  async function submitPayment({ method, amount }) {
    try {
      setPayLoading(true);
      setToast("");

      const res = await postJSON(`/api/orders/${id}/payment`, { method, amount });
      if (!res?.ok) throw new Error(res?.error || "บันทึกการชำระล้มเหลว");

      // optimistic
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              payment_status: "PAID",
              payment_method: String(method || "").toUpperCase(),
              paid_at: new Date().toISOString(),
            }
          : prev
      );

      setPayOpen(false);
      setToast("บันทึกการชำระเงินเรียบร้อย");
      await load();
    } catch (e) {
      setToast(e.message || "บันทึกการชำระล้มเหลว");
    } finally {
      setPayLoading(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  async function revertPaymentInternal() {
    try {
      setConfirmLoading(true);

      const res = await delJSON(`/api/orders/${id}/payment`);
      if (!res?.ok) throw new Error(res?.error || "ยกเลิกการชำระไม่สำเร็จ");

      // optimistic revert
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              payment_status: "UNPAID",
              payment_method: null,
              paid_at: null,
            }
          : prev
      );

      setToast("ยกเลิกการชำระเงินแล้ว");
      await load();
    } catch (e) {
      setToast(e.message || "ยกเลิกการชำระไม่สำเร็จ");
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <div className="w-full max-w-none p-4 md:p-6 space-y-6 pb-[calc(112px+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4 shadow-sm backdrop-blur">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(253,88,0,.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,.08),transparent_45%)]" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white shadow ring-1 ring-orange-400/50">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
                ออเดอร์ #{formatOrderCode(order?.order_code, idOk ? id : "-")}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                {order?.table_no && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
                    โต๊ะ {order.table_no}
                  </span>
                )}
                <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-slate-600 ring-1 ring-slate-200">
                  {items.length} รายการ
                </span>
                <PaymentStatusBadge status={paymentStatus} />
              </div>
            </div>
          </div>

          <a href="/dashboard/orders_done" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าออเดอร์
          </a>
        </div>
      </div>

      {/* toasts / error */}
      {toast && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">{toast}</div>}
      {err &&   <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">{err}</div>}

      {/* Content */}
      <div className="grid gap-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <colgroup>
                <col className="w-[110px]" /><col /><col className="w-[98px]" />
                <col className="w-[120px]" /><col className="w-[128px]" />
                <col className="w-[300px]" /><col className="w-[100px]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur text-slate-600 shadow-[inset_0_-1px_0_0_rgba(0,0,0,.05)]">
                <tr>
                  <th className="px-4 py-3 text-left">รหัสอาหาร</th>
                  <th className="px-4 py-3 text-left">ชื่อ</th>
                  <th className="px-4 py-3 text-left">รูปภาพ</th>
                  <th className="px-4 py-3 text-right">ราคา</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-left">หมายเหตุ</th>
                  <th className="px-4 py-3 text-center">จำนวน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 w-16 rounded-full bg-slate-200" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-40 rounded-full bg-slate-200" /></td>
                    <td className="px-4 py-3"><div className="h-12 w-12 rounded-xl bg-slate-200" /></td>
                    <td className="px-4 py-3"><div className="ml-auto h-3 w-16 rounded-full bg-slate-200" /></td>
                    <td className="px-4 py-3 text-center"><div className="mx-auto h-5 w-20 rounded-full bg-slate-200" /></td>
                    <td className="px-4 py-3"><div className="h-9 w-full rounded-xl bg-slate-200" /></td>
                    <td className="px-4 py-3 text-center"><div className="mx-auto h-8 w-16 rounded-xl bg-slate-200" /></td>
                  </tr>
                ))}

                {!loading && items.map((it) => {
                  const price = Number(it.price ?? it.unit_price ?? 0);
                  return (
                    <tr key={it.id} className="group transition-colors hover:bg-orange-50/30">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{String(it.id).padStart(6, "0")}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 group-hover:text-slate-900">{it.name}</div>
                        {it.category && <div className="mt-0.5 text-xs text-slate-500">{it.category}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl ring-1 ring-slate-200">
                          <img
                            src={it.image_url ?? it.imageUrl ?? FALLBACK_IMG}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">฿{fmtTHB(price)}</td>
                      <td className="px-4 py-3 text-center"><CookingStatusPill value={it.status} /></td>
                      <td className="px-4 py-3">
                        <input
                          value={it.note?.trim() ? it.note : "—"}
                          readOnly
                          disabled
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1 tabular-nums">
                          {it.qty}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!loading && !items.length && (
                  <tr><td className="px-4 py-12 text-center text-slate-500" colSpan={7}>ไม่พบรายการในออเดอร์นี้</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <SoftDivider />
        </div>
      </div>

      {/* ===== Sticky Bottom Summary / Actions ===== */}
      <div className="pointer-events-none fixed bottom-0 right-0 left-0 md:left-[256px] z-40 px-3 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="pointer-events-auto w-full max-w-none rounded-2xl border border-slate-200 bg-white/90 backdrop-blur shadow-lg ring-1 ring-black/5 px-4 py-3 md:px-5 md:py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="grid flex-1 grid-cols-3 gap-3 md:max-w-2xl">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2">
                <div className="text-xs text-slate-500">ยอดก่อนคิดค่าบริการ</div>
                <div className="tabular-nums text-slate-800">฿{fmtTHB(subtotal)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2">
                <div className="text-xs text-slate-500">ค่าบริการ ({serviceRate}%)</div>
                <div className="tabular-nums text-slate-800">฿{fmtTHB(service)}</div>
              </div>
              {discount > 0 ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2">
                  <div className="text-xs text-rose-600">ส่วนลด</div>
                  <div className="tabular-nums font-medium text-rose-600">-฿{fmtTHB(discount)}</div>
                </div>
              ) : (
                <div className="rounded-xl border border-transparent px-4 py-2" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 mr-1">
                <div className="text-xs text-orange-600">ยอดรวมสุทธิ</div>
                <div className="tabular-nums font-semibold text-orange-700">฿{fmtTHB(grand)}</div>
              </div>

              {paymentStatus !== "PAID" ? (
                <button
                  onClick={() => setPayOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-white shadow-sm ring-1 ring-orange-400/60 hover:bg-orange-700"
                >
                  <Banknote className="h-4 w-4" /> ชำระเงิน (฿{fmtTHB(grand)})
                </button>
              ) : (
                <>
                  <div className="text-sm text-slate-600">
                    วิธีชำระ: <span className="font-medium">{order?.payment_method || "-"}</span>
                  </div>
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    ยกเลิกการชำระ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        open={payOpen}
        defaultAmount={grand}
        loading={payLoading}
        onClose={() => setPayOpen(false)}
        onSubmit={submitPayment}
      />
      <ConfirmDialog
        open={confirmOpen}
        loading={confirmLoading}
        title="ยกเลิกการชำระเงิน"
        message="ยืนยันการยกเลิกสถานะชำระเงินของบิลนี้ใช่ไหม?"
        confirmText="ยืนยันยกเลิก"
        cancelText="ปิด"
        onConfirm={revertPaymentInternal}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
