// components/OrderPlacedLike.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const POLL_MS = 4000;

const fmtTHB = (n) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" })
    .format(Number.isFinite(+n) ? +n : 0);

const numOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const s = typeof v === "string" ? v.replace(/[^\d.\-]/g, "") : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

function DrinkIcon({ className = "w-14 h-14" }) { return <div className={className} />; }
function BottleIcon({ className = "w-14 h-14" }) { return <div className={className} />; }

const statusText = {
  queued: "กำลังรับออเดอร์",
  doing: "กำลังทำ",
  done: "พร้อมเสิร์ฟ",
  ready: "พร้อมเสิร์ฟ",
  served: "เสิร์ฟแล้ว",
  canceled: "ยกเลิก",
};

const norm = (v) => String(v || "").toLowerCase();

/** แปลง service_rate เป็น “ตัวคูณ” 0–1 อย่างปลอดภัย
 *  ตัวอย่างที่รองรับ:
 *   - 0.1   -> 0.1      (10%)
 *   - 2.5   -> 0.025    (2.5%)
 *   - 10    -> 0.10     (10%)
 *   - 100   -> 1.0      (100%)
 *   - >100  -> 1.0      (cap)
 *   - <0    -> 0
 */
function normalizeRate(raw) {
  const n = Number(String(raw).replace(/[^\d.\-]/g, ""));
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n <= 1) return n;         // ค่าที่เป็นตัวคูณอยู่แล้ว เช่น 0.1
  if (n <= 100) return n / 100; // ค่าที่เป็นเปอร์เซ็นต์ เช่น 2.5/10/100
  return 1;                     // เกิน 100% ก็ปัก 100%
}

function deriveOrderNumbers(order, items) {
  const itemsSubtotal = (items || []).reduce((s, it) => {
    const lt = numOrNull(it?.line_total);
    if (lt !== null) return s + lt;
    const up = numOrNull(it?.unit_price) ?? 0;
    const q  = numOrNull(it?.qty) ?? 0;
    return s + up * q;
  }, 0);

  const subtotal = numOrNull(order?.subtotal) ?? Number(itemsSubtotal.toFixed(2));
  const discount = Math.max(0, numOrNull(order?.discount) ?? 0);
  const base = Math.max(0, subtotal - discount);

  const itemsAllReadyOrDone =
    (items || []).length > 0 &&
    (items || []).every((it) => ["ready", "done", "served", "canceled"].includes(norm(it?.status)));
  const overallStatus = norm(order?.status) || (itemsAllReadyOrDone ? "ready" : "doing");

  return { subtotal, discount, base, status: overallStatus };
}

// ----- API helpers -----
async function fetchSettingsRate() {
  try {
    const r = await fetch("/api/settings", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.ok) {
      return normalizeRate(j?.data?.service_rate);
    }
  } catch {}
  return 0; // ถ้าดึงไม่ได้ ให้ถือว่า 0
}

async function fetchByCode(orderCode) {
  const r = await fetch(`/api/orders/${encodeURIComponent(orderCode)}`, { cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j.data; // { order, items }
}

async function listByTable(tableNo) {
  const r = await fetch(`/api/orders/by-table?table_no=${encodeURIComponent(tableNo)}&limit=50`, { cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return Array.isArray(j.data) ? j.data : [];
}

export default function OrderPlacedLike({ code, tableFromQR, onCloseHref = "/orders" }) {
  const router = useRouter();

  const [state, setState] = useState(null); // { items, orderAgg, status, effRatePct, orderCode, table }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!cancelled) { setLoading(true); setError(""); }

        const table =
          tableFromQR ||
          (typeof window !== "undefined" ? localStorage.getItem("table_name") : "") ||
          "";

        // ตัดสินใจว่าจะดูบิลไหน
        let chosenCode = code || null;
        if (!chosenCode && table) {
          const list = (await listByTable(table))
            .filter((o) => (o.payment_status || "UNPAID").toUpperCase() !== "PAID")
            .sort((a, b) => {
              const ta = new Date(a.created_at || a.createdAt || 0).getTime();
              const tb = new Date(b.created_at || b.createdAt || 0).getTime();
              return tb - ta; // ล่าสุดก่อน
            });
          if (list[0]?.order_code) chosenCode = list[0].order_code;
        }
        if (!chosenCode) throw new Error("ยังไม่พบออเดอร์ของโต๊ะนี้");

        // ดึงรายละเอียดบิล
        const detail = await fetchByCode(chosenCode); // { order, items }
        const order  = detail?.order || {};
        const items  = detail?.items || [];

        // 1) พยายามใช้ service_rate จากบิลก่อน
        // 2) ถ้าในบิลไม่มี/ว่าง ให้ fallback เป็นค่าจาก settings
        let rate = normalizeRate(order?.service_rate);
        if (!rate) {
          const settingsRate = await fetchSettingsRate();
          rate = normalizeRate(settingsRate);
        }

        const nums   = deriveOrderNumbers(order, items);
        const base   = Number(nums.base || 0);
        const sc     = Number((base * rate).toFixed(2));
        const total  = Number((base + sc).toFixed(2));

        const orderAgg = {
          subtotal: Number(((nums.subtotal ?? 0)).toFixed(2)),
          discount: Number(((nums.discount ?? 0)).toFixed(2)),
          base:     Number(base.toFixed(2)),
          service_charge: Number(sc.toFixed(2)),
          total:    Number(total.toFixed(2)),
        };

        if (!cancelled) {
          setState({
            items,
            orderAgg,
            status: nums.status,          // "ready" เมื่อเมนูทั้งหมดพร้อม
            effRatePct: rate * 100,       // สำหรับโชว์เป็น %
            orderCode: order?.order_code || chosenCode,
            table: table || null,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    // ตั้ง polling และเก็บไว้ใน ref เพื่อหยุดตอน redirect
    pollRef.current = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [code, tableFromQR]);

  const items = state?.items || [];
  const orderAgg = state?.orderAgg || {};
  const effRatePct = state?.effRatePct ?? 0;
  const orderCode = state?.orderCode || "";
  const tableName = state?.table || "";

  // ✅ อนุญาตเช็คบิลเมื่อ "พร้อมเสิร์ฟทั้งหมด" เท่านั้น
  const canRequestBill = items.length > 0 && state?.status === "ready" && !submitting;

  const onRequestBill = async () => {
    if (!canRequestBill) return;
    setSubmitting(true);

    // หยุด polling ป้องกันกระพริบ/แข่งกัน setState
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    try {
      const snapshot = {
        items: items.map(it => ({
          name: it.name,
          qty: Number(it.qty || 0),
          unit_price: Number(it.unit_price || 0),
        })),
        tableNo: tableName || "",
        orderCode: orderCode || "",
        serviceRate: Number(effRatePct) / 100,
        subtotal: Number(orderAgg.base || 0),
        serviceCharge: Number(orderAgg.service_charge || 0),
        grandTotal: Number(orderAgg.total || 0),
      };
      try { sessionStorage.setItem("bill:current", JSON.stringify(snapshot)); } catch {}
      const href = tableName
        ? `/checkout?table=${encodeURIComponent(tableName)}`
        : (orderCode ? `/checkout?code=${encodeURIComponent(orderCode)}` : "/checkout");
      router.push(href);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b" style={{ borderColor: "#E9E9EB" }}>
        <div className="relative h-14 max-w-screen-sm mx-auto flex items-center justify-center">
          <a
            href={onCloseHref}
            className="absolute left-2 flex items-center gap-1 px-3 py-2 rounded-lg text-[#F4935E] hover:bg-[#FFF2EA]"
            aria-label="ย้อนกลับไปหน้าออเดอร์"
          >
            <ChevronLeft className="w-7 h-7 shrink-0" strokeWidth={2.6} />
          </a>
          <h1 className="text-xl font-semibold text-slate-800">ออเดอร์ที่สั่ง</h1>
        </div>

        {orderCode && (
          <div className="mx-auto max-w-screen-sm px-4 pb-3">
            <span
              className="px-3 py-1 rounded-full border text-[13px] font-mono"
              style={{ borderColor: "#E9E9EB", color: "#0F172A", background: "#F7F8FA" }}
              aria-label="เลขออเดอร์"
              title="เลขออเดอร์"
            >
              #{orderCode}
            </span>
          </div>
        )}
      </header>

      {/* List */}
      <main className="max-w-screen-sm mx-auto w-full flex-1">
        {loading && <div className="px-6 py-8 text-center text-slate-500">กำลังโหลด...</div>}
        {!loading && error && <div className="px-6 py-8 text-center text-slate-500">{error}</div>}
        {!loading && !error && (
          <div className="pt-2">
            {items.map((it, i) => (
              <div key={`${it.id || i}-${orderCode}`}>
                <div className="mx-4 my-3 rounded-2xl p-4 border" style={{ background: "#F7F8FA", borderColor: "#E9E9EB" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden" style={{ background: "#E9EBEF" }}>
                      <div className="absolute inset-0 grid place-items-center">
                        {/น้ำ|ชา|กาแฟ|โค้ก|อัดลม/i.test(it.name) ? <BottleIcon /> : <DrinkIcon />}
                      </div>
                      {it.imageUrl && (
                        <img
                          src={it.imageUrl}
                          alt={it.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-[18px] font-semibold text-slate-800 truncate">{it.name}</p>
                          <p className="text-slate-400 text-sm">ID {String(it.product_id)}</p>
                          {it.note && <p className="text-sm text-slate-500 mt-1">หมายเหตุ: {it.note}</p>}
                        </div>
                        <p className="text-slate-900 font-semibold">{fmtTHB(it.unit_price)}</p>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[20px] font-semibold" style={{ color: "#F4935E" }}>
                          x {it.qty}
                        </span>
                        <span className="text-[17px]" style={{ color: "#F4935E" }}>
                          {statusText[norm(it.status)] || "กำลังทำ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {i !== items.length - 1 && <div className="mx-6 h-px" style={{ background: "#E9E9EB" }} />}
              </div>
            ))}

            {state?.status !== "ready" && items.length > 0 && (
              <div className="px-6 pt-2 pb-4 text-sm text-amber-700">
                ต้องรอให้เมนูในออเดอร์ “พร้อมเสิร์ฟ” ทั้งหมดก่อนจึงจะเช็คบิลได้
              </div>
            )}
          </div>
        )}
      </main>

      {/* สรุป + ปุ่มเช็คบิล */}
      <div className="sticky bottom-0 z-50 bg-white/95 backdrop-blur border-t" style={{ borderColor: "#E9E9EB" }}>
        <div className="max-w-screen-sm mx-auto w-full px-4 pt-3 pb-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
          <div className="flex items-center justify-between text-slate-400">
            <span>service rate</span>
            <span>{orderAgg.base > 0 ? `${(effRatePct ?? 0).toFixed(2)} %` : "—"}</span>
          </div>

          <div className="mt-1 flex items-center justify-between text-slate-400">
            <span>ค่าบริการ</span>
            <span>{orderAgg.service_charge != null ? fmtTHB(orderAgg.service_charge) : "—"}</span>
          </div>

          <div className="mt-1 text-slate-400 text-sm flex items-center justify-between">
            <span>รวมค่าอาหาร</span>
            <span>{orderAgg.base != null ? fmtTHB(orderAgg.base) : "—"}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg text-slate-800">{items.length} รายการ</span>
            <span className="text-2xl font-semibold text-slate-900">
              รวม {orderAgg.total != null ? fmtTHB(orderAgg.total) : "—"}
            </span>
          </div>

          <button
            onClick={onRequestBill}
            disabled={!canRequestBill}
            className={`mt-3 w-full h-14 rounded-2xl text-white text-[18px] font-semibold shadow-[0_-6px_12px_rgba(0,0,0,0.06)] transition
              ${canRequestBill ? "bg-[#F4935E] hover:opacity-95 active:translate-y-[0.5px]" : "bg-gray-300 cursor-not-allowed"}`}
          >
            {submitting
              ? "กำลังไปหน้าเช็คบิล..."
              : (state?.status === "ready" ? "เช็คบิล" : "รอเมนูพร้อมเสิร์ฟ")}
          </button>
        </div>
      </div>
    </div>
  );
}
