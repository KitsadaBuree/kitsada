// components/BillCalled.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const fmtTHB = (n) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" })
    .format(Number(n || 0));

/**
 * หมายเหตุเรื่อง service:
 * - สามารถส่งมาเป็น 2.5 (เปอร์เซ็นต์) หรือ 0.025 (อัตราทศนิยม) ได้
 * - component จะแปลงและแสดงผลให้ถูกต้องเสมอ
 */
export default function BillCalled({
  items: itemsProp = [],
  tableNo: tableNoProp = "",
  orderCode: orderCodeProp = "",
  serviceRate: serviceRateProp = 0, // ✅ default เป็นอัตราทศนิยม 2.5%
  title = "ขอคิดเงินแล้ว",
  subtitle = "กรุณารอพนักงานยืนยันยอดที่โต๊ะ หรือ ติดต่อเคาน์เตอร์",
  backHref = "/",
}) {
  // ---- โหลด snapshot จาก sessionStorage เมื่อไม่มี props ----
  const [stored, setStored] = useState(null);
  useEffect(() => {
    if (itemsProp.length) return;
    try {
      const raw = sessionStorage.getItem("bill:current");
      if (raw) setStored(JSON.parse(raw));
    } catch {}
  }, [itemsProp.length]);

  // ---- เช็กสถานะสมาชิก (fallback เมื่อ snapshot ไม่มีชื่อ) ----
  const [isMember, setIsMember] = useState(Boolean(stored?.memberName));
  const [memberName, setMemberName] = useState(stored?.memberName || "");
  useEffect(() => {
    if (memberName) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/profile", { credentials: "include" });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        if (r.ok && j?.ok) {
          setIsMember(true);
          setMemberName(String(j.profile?.name || ""));
        } else {
          setIsMember(false);
        }
      } catch {
        if (alive) setIsMember(false);
      }
    })();
    return () => { alive = false; };
  }, [memberName]);

  // ---- เลือกแหล่งข้อมูลที่จะใช้ (props > snapshot) ----
  const items = itemsProp.length
    ? itemsProp
    : (stored?.items || []).map(it => ({
        name: it.name,
        qty: Number(it.qty ?? 0),
        unit_price: Number(it.unit_price ?? it.price ?? 0),
      }));

  const tableNo   = tableNoProp   || stored?.tableNo   || "";
  const orderCode = orderCodeProp || stored?.orderCode || "";

  const hasSnapshotTotals =
    stored &&
    ["subtotal","serviceCharge","discountBaht","grandTotal"].every(k =>
      Number.isFinite(Number(stored[k]))
    );

  // ---- แปลง service rate ให้เป็น factor เสมอ + ตัวเลขสำหรับแสดงผล ----
  const srInput = itemsProp.length
    ? serviceRateProp
    : (stored?.serviceRate ?? serviceRateProp);

  // factor 0–1
  const serviceRateFactor = useMemo(() => {
    const n = Number(srInput);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n > 1 ? n / 100 : n;
  }, [srInput]);

  // ตัวเลขเปอร์เซ็นต์สำหรับแสดง (ตัด .00 ออก)
  const serviceRatePercentText = useMemo(() => {
    const pct = (serviceRateFactor * 100).toFixed(2);
    return pct.replace(/\.00$/, "");
  }, [serviceRateFactor]);

  // ---- คำนวณยอด ----
  const subtotal = useMemo(() => {
    if (hasSnapshotTotals) return Number(stored.subtotal);
    return items.reduce((s, it) => s + Number(it.unit_price || 0) * Number(it.qty || 0), 0);
  }, [items, hasSnapshotTotals, stored]);

  const serviceCharge = useMemo(() => {
    if (hasSnapshotTotals) return Number(stored.serviceCharge);
    return +(subtotal * serviceRateFactor).toFixed(2);
  }, [subtotal, serviceRateFactor, hasSnapshotTotals, stored]);

  const discountBaht = hasSnapshotTotals ? Number(stored.discountBaht) : 0;

  const totalBeforeDiscount = useMemo(
    () => +(subtotal + serviceCharge).toFixed(2),
    [subtotal, serviceCharge]
  );

  const grandTotal = hasSnapshotTotals
    ? Number(stored.grandTotal)
    : Math.max(0, +(totalBeforeDiscount - discountBaht).toFixed(2));

  const earnedPoints = useMemo(() => Math.floor(grandTotal / 10), [grandTotal]);
  const showPointsBox = isMember;

  return (
    <div className="min-h-dvh bg-[#F3F4F6] flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
          <CheckCircle2 className="w-9 h-9 text-green-500" />
        </div>
        <h1 className="mt-4 text-[28px] font-extrabold text-[#111827] tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-[#6B7280] text-[15px]">
          {subtitle}{tableNo ? ` · โต๊ะ ${tableNo}` : ""}
        </p>
      </header>

      {/* Content */}
      <main className="max-w-screen-sm mx-auto w-full px-5 pb-28">
        <section
          className="rounded-3xl bg-white border shadow-[0_8px_20px_rgba(0,0,0,0.05)] p-6"
          style={{ borderColor: "#E5E7EB" }}
        >
          <h2 className="text-[18px] font-semibold text-[#1F2937] mb-2">
            รายการอาหารที่สั่ง ({items.length})
          </h2>

          <ul className="divide-y" style={{ borderColor: "#E5E7EB" }}>
            {items.length ? (
              items.map((it, idx) => (
                <li key={`${it.name}-${idx}`} className="py-4 flex items-center justify-between text-[#374151]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-[#F4935E] [font-variant-numeric:tabular-nums]">
                      {it.qty}x
                    </span>
                    <span className="truncate">{it.name}</span>
                  </div>
                  <span className="[font-variant-numeric:tabular-nums]" style={{ letterSpacing: "0.01em" }}>
                    {fmtTHB(Number(it.unit_price || 0) * Number(it.qty || 0))}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-4 text-center text-[#9CA3AF]">ไม่พบข้อมูลบิล</li>
            )}
          </ul>

          {/* สรุป */}
          <div className="mt-4 text-[#9CA3AF] text-[15px] space-y-1">
            <div className="flex justify-between">
              <span>service rate</span>
              <span>{serviceRatePercentText}%</span>
            </div>
            <div className="flex justify-between">
              <span>รวมค่าอาหาร</span>
              <span>{fmtTHB(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>ค่าบริการ</span>
              <span>{fmtTHB(serviceCharge)}</span>
            </div>
            {discountBaht > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>ส่วนลดจาก Point</span>
                <span>-{fmtTHB(discountBaht)}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: "#FDE2CF" }}>
            <div className="flex justify-between items-end">
              <span className="text-[20px] font-semibold text-[#F4935E]">ราคารวมสุทธิ</span>
              <div className="text-right">
                {discountBaht > 0 && (
                  <div className="text-[13px] text-[#9CA3AF] line-through [font-variant-numeric:tabular-nums]">
                    {fmtTHB(totalBeforeDiscount)}
                  </div>
                )}
                <span className="text-[34px] font-extrabold [font-variant-numeric:tabular-nums]" style={{ color: "#E88452" }}>
                  {fmtTHB(grandTotal)}
                </span>
              </div>
            </div>

            {(orderCode || tableNo) && (
              <div className="mt-4 text-[13px] text-[#6B7280] text-center">
                {orderCode && <>เลขที่บิล: <span className="text-[#374151]">{orderCode}</span></>}
                {tableNo && <> {" "}· โต๊ะ <span className="text-[#374151]">{tableNo}</span></>}
              </div>
            )}

            {/* คะแนนที่จะได้รับ — แสดงเฉพาะสมาชิก */}
            {showPointsBox && (
              <div className="mt-4 rounded-2xl border p-4 bg-orange-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">คะแนนที่จะได้รับ</span>
                  <span className="font-semibold text-orange-600 [font-variant-numeric:tabular-nums]">
                    {earnedPoints} Point
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1">คิดจากยอดรวมสุทธิ ÷ 10 (ปัดลง)</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur border-t" style={{ borderColor: "#E5E7EB" }}>
        <div className="max-w-screen-sm mx-auto px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <a
            href={backHref}
            className="block w-full text-center py-4 rounded-2xl font-semibold text-[18px] text-white 
                       shadow-[0_4px_12px_rgba(244,147,94,0.4)] hover:opacity-95 active:scale-[0.99] transition-all"
            style={{ background: "#F4935E" }}
          >
            กลับหน้าหลัก
          </a>
        </div>
      </footer>
    </div>
  );
}
