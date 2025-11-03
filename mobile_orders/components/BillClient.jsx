// components/BillClient.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Info, User, CheckCircle2 } from "lucide-react";

const POINTS_STEP = 100;
const DISCOUNT_PER_STEP_BAHT = 1;

const fmtTHB = (n) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" })
    .format(Number.isFinite(+n) ? +n : 0);

// แสดงอัตราเป็นเปอร์เซ็นต์ (รองรับทศนิยม)
const fmtPercent = (rate) => {
  const n = Number(rate) * 100;
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  });
};

async function requestBill(orderCode, payload) {
  if (!orderCode) throw new Error("ไม่พบรหัสใบเสร็จ");
  const res = await fetch(
    `/api/orders/${encodeURIComponent(orderCode)}/request-bill`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    }
  );
  let j = {};
  try { j = await res.json(); } catch {}
  if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`);
  return j;
}

export default function BillClient({
  items = [],
  tableNo = "",
  orderCode = "",
  serviceRate = 0.10,   // 0.10 = 10%
  onCloseHref = "/",
}) {
  const router = useRouter();

  // ======== ค่าแน่นอนของแถบล่าง + spacer (แก้ปุ่มบัง) ========
  const FOOTER_H = 96; // ปรับได้ตามดีไซน์ (รวม heading + ปุ่ม)
  const spacerH = `calc(${FOOTER_H}px + env(safe-area-inset-bottom))`;
  // ============================================================

  // ------- UI state -------
  const [method, setMethod] = useState("cashier");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState("");

  // ------- Member / Points -------
  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsUse, setPointsUse] = useState(0);
  const [memberName, setMemberName] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/profile", { credentials: "include" });
        const j = await r.json().catch(() => ({}));
        if (alive && r.ok && j?.ok) {
          setAvailablePoints(Number(j.profile?.points ?? 0));
          setMemberName(String(j.profile?.name || ""));
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  // ------- Calculations -------
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.unit_price || 0) * Number(it.qty || 0), 0),
    [items]
  );

  const serviceCharge = useMemo(
    () => Number((subtotal * Number(serviceRate || 0)).toFixed(2)),
    [subtotal, serviceRate]
  );

  const maxByAmount = useMemo(() => {
    const maxBaht = Math.max(0, subtotal + serviceCharge);
    return Math.floor(maxBaht / DISCOUNT_PER_STEP_BAHT) * POINTS_STEP;
  }, [subtotal, serviceCharge]);

  const maxUsablePoints = useMemo(
    () => Math.max(0, Math.min(availablePoints, maxByAmount)),
    [availablePoints, maxByAmount]
  );

  const normalizePoints = (val, max) => {
    let v = Math.max(0, Math.min(Number.isFinite(+val) ? +val : 0, max));
    return Math.floor(v / POINTS_STEP) * POINTS_STEP;
  };

  useEffect(() => {
    setPointsUse(prev => normalizePoints(prev, maxUsablePoints));
  }, [maxUsablePoints]);

  const discountBaht = useMemo(
    () => (pointsUse / POINTS_STEP) * DISCOUNT_PER_STEP_BAHT,
    [pointsUse]
  );

  const grandTotal = useMemo(
    () => Math.max(0, Number((subtotal + serviceCharge - discountBaht).toFixed(2))),
    [subtotal, serviceCharge, discountBaht]
  );

  // ------- Handlers -------
  const handlePointsChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setPointsUse(normalizePoints(raw, maxUsablePoints));
  };
  const handlePointsBlur = () => setPointsUse(prev => normalizePoints(prev, maxUsablePoints));
  const addPoints = (d) => setPointsUse(prev => normalizePoints(prev + d, maxUsablePoints));
  const useAllPoints = () => setPointsUse(maxUsablePoints);

  const handleContinue = () => {
    if (confirmOpen || confirming) return;
    setErr("");
    setConfirmOpen(true);
  };

  useEffect(() => {
    if (!confirmOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setConfirmOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [confirmOpen]);

  async function handleConfirm() {
    try {
      setConfirming(true);
      setErr("");
      await requestBill(orderCode, {
        points_used: pointsUse,
        discount_baht: discountBaht,
        subtotal,
        service_charge: serviceCharge,
        grand_total: grandTotal,
      });
      setConfirmOpen(false);

      try {
        const payload = {
          items, serviceRate, subtotal, serviceCharge,
          discountBaht, pointsUse, grandTotal,
          tableNo, orderCode, method, ts: Date.now(), memberName,
        };
        sessionStorage.setItem("bill:current", JSON.stringify(payload));
        localStorage.setItem("last_order_code", orderCode || "");
        localStorage.setItem("table_name", String(tableNo || ""));
      } catch {}

      router.push(`/receipt/${encodeURIComponent(orderCode)}`);
    } catch (e) {
      setErr(e.message || "ขอเช็คบิลไม่สำเร็จ");
    } finally {
      setConfirming(false);
    }
  }

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(onCloseHref || "/");
  };

  // ------- UI -------
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b" style={{ borderColor: "#E9E9EB" }}>
        <div className="relative h-14 max-w-screen-sm mx-auto flex items-center justify-center">
          <button onClick={handleClose} className="absolute left-2 p-3 rounded-xl hover:bg-slate-100" aria-label="ปิด">
            <X className="w-6 h-6 text-slate-800" />
          </button>
          <h1 className="text-xl font-semibold text-slate-800">บิลค่าอาหาร</h1>
          <span className="absolute right-3 px-2.5 py-1 rounded-full text-[12px] border" style={{ borderColor: "#E9E9EB" }}>
            โต๊ะ {tableNo || "-"}
          </span>
        </div>
        <div className="max-w-screen-sm mx-auto w-full px-4 pb-2">
          <p className="text-[13px] text-slate-400">
            รหัสใบเสร็จ <span className="font-medium text-slate-600">{orderCode || "-"}</span>
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-screen-sm mx-auto w-full px-4 pt-3">
        <p className="text-[18px] font-semibold text-slate-800 mb-2">
          รายการที่สั่ง <span className="text-slate-500">({items.length})</span>
        </p>

        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#E9E9EB" }}>
          {items.map((it, i) => {
            const lineTotal = Number(it.unit_price) * Number(it.qty);
            return (
              <div key={`${it.name}-${i}`}>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold" style={{ color: "#F4935E" }}>{it.qty}x</span>
                    <span className="text-[16px] text-slate-700 truncate">{it.name}</span>
                  </div>
                  <span className="text-slate-900">{fmtTHB(lineTotal)}</span>
                </div>
                {i !== items.length - 1 && <div className="h-px" style={{ background: "#E9E9EB" }} />}
              </div>
            );
          })}

          {/* สรุปท้ายรายการ — "service rate" + "ค่าบริการ" */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between text-slate-400">
              <span>service rate</span>
              <span>{fmtPercent(serviceRate)} %</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-sm mt-1">
              <span>ค่าบริการ</span>
              <span>{fmtTHB(serviceCharge)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-sm mt-1">
              <span>รวมค่าอาหาร</span>
              <span>{fmtTHB(subtotal)}</span>
            </div>
          </div>

          <div className="h-2 bg-slate-100" />

          {/* ราคารวม (ก่อนหักแต้ม) */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-semibold text-[17px]" style={{ color: "#F4935E" }}>ราคารวม</span>
            <span
              className="leading-none font-extrabold text-[25px] sm:text-[32px] tracking-[0.08em]"
              style={{ color: "#E88452", fontVariantNumeric: "tabular-nums" }}
            >
              {fmtTHB(subtotal + serviceCharge)}
            </span>
          </div>
        </div>

        {/* ใช้ Point */}
        {(memberName || availablePoints > 0) ? (
          <div className="mt-4 rounded-2xl border p-4 flex flex-col gap-3" style={{ borderColor: "#E9E9EB" }}>
            <div className="flex items-center justify-between">
              <div className="text-slate-900 font-semibold">ใช้ Point</div>
              <button
                type="button"
                onClick={useAllPoints}
                className="h-9 px-3 rounded-lg border text-slate-700 text-sm disabled:opacity-40"
                style={{ borderColor: "#E9E9EB" }}
                disabled={maxUsablePoints === 0 || pointsUse === maxUsablePoints}
                title="ใช้แต้มได้สูงสุด"
              >
                ใช้ทั้งหมด
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addPoints(-POINTS_STEP)}
                  className="h-10 w-10 rounded-lg border text-slate-700 grid place-items-center disabled:opacity-40"
                  style={{ borderColor: "#E9E9EB" }}
                  disabled={pointsUse <= 0}
                  aria-label={`ลบ ${POINTS_STEP} แต้ม`}
                >
                  −
                </button>

                <input
                  inputMode="numeric"
                  value={pointsUse}
                  onChange={handlePointsChange}
                  onBlur={handlePointsBlur}
                  className="h-10 w-28 rounded-xl border outline-none text-center text-[18px] font-semibold"
                  style={{ borderColor: "#F4B899", color: "#F4935E" }}
                  aria-label="จำนวนแต้มที่จะใช้"
                />

                <button
                  type="button"
                  onClick={() => addPoints(POINTS_STEP)}
                  className="h-10 w-10 rounded-lg border text-slate-700 grid place-items-center disabled:opacity-40"
                  style={{ borderColor: "#E9E9EB" }}
                  disabled={pointsUse >= maxUsablePoints}
                  aria-label={`เพิ่ม ${POINTS_STEP} แต้ม`}
                >
                  +
                </button>
              </div>

              <div className="text-right leading-tight">
                <div className="text-slate-400 text-xs">STEP</div>
                <div className="text-slate-500 font-medium tabular-nums">{POINTS_STEP}</div>
              </div>
            </div>

            <div className="text-slate-500 text-sm">
              {memberName ? <>คุณ <span className="text-slate-700 font-medium">{memberName}</span> มี <span className="tabular-nums">{availablePoints}</span> Point</>
                          : <>คุณมี <span className="tabular-nums">{availablePoints}</span> Point</>}
              <span className="mx-2 text-slate-300">•</span>
              <span className="text-slate-500"><span className="tabular-nums">{POINTS_STEP}</span> Point = {DISCOUNT_PER_STEP_BAHT} บาท</span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>ส่วนลดจาก Point (<span className="tabular-nums">{pointsUse}</span> pt)</span>
                <span className="text-rose-600">-{fmtTHB(discountBaht)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium text-slate-900">ราคาสุทธิ</span>
                <span className="font-semibold text-slate-900">{fmtTHB(grandTotal)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mt-4 rounded-2xl px-4 py-3 text-sm flex items-start gap-2"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
          >
            <Info className="w-5 h-5 mt-0.5 text-slate-500" />
            <p className="text-slate-600">เข้าสู่ระบบเพื่อสะสมและใช้ Point เป็นส่วนลดการชำระเงิน</p>
          </div>
        )}

        <p className="mt-6 mb-2 text-[18px] font-semibold text-slate-800">วิธีการชำระเงิน</p>
        <div
          className="rounded-xl px-4 py-2.5 flex items-start gap-2 mb-3"
          style={{ background: "#FFF2EA", border: "1px solid #FFD8C5", color: "#F4935E" }}
        >
          <Info className="w-5 h-5 mt-0.5" />
          <p className="text-[14px]">ชำระเงินค่าอาหาร เมื่อคุณทานเสร็จเรียบร้อยแล้วเท่านั้น</p>
        </div>

        <button
          type="button"
          onClick={() => setMethod("cashier")}
          className="w-full rounded-xl border bg-white px-4 py-4 flex items-center justify-between"
          style={{ borderColor: "#E9E9EB" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl grid place-items-center bg-slate-100">
              <User className="w-6 h-6 text-slate-700" />
            </div>
            <span className="text-slate-800 font-medium">ชำระเงินกับพนักงาน</span>
          </div>
          <span
            className="w-6 h-6 rounded-full grid place-items-center"
            style={{ border: `2px solid ${method === "cashier" ? "#F4935E" : "#D1D5DB"}` }}
          >
            {method === "cashier" && <span className="w-3 h-3 rounded-full" style={{ background: "#F4935E" }} />}
          </span>
        </button>

        {/* ✅ Spacer กันไม่ให้ปุ่มทับเนื้อหา */}
        <div aria-hidden style={{ height: spacerH }} />
      </main>

      {/* Sticky CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur border-t"
        style={{
          borderColor: "#E9E9EB",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
        }}
      >
        <div className="mx-auto max-w-screen-sm px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">ราคาสุทธิ</span>
            <span className="text-2xl font-semibold text-slate-900">{fmtTHB(grandTotal)}</span>
          </div>
          <button
            className="w-full h-14 rounded-2xl text-white text-[18px] font-semibold shadow-[0_-6px_12px_rgba(0,0,0,0.06)] hover:opacity-95 active:translate-y-[0.5px] transition disabled:opacity-60"
            style={{ background: "#F4935E" }}
            onClick={handleContinue}
            disabled={confirmOpen}
          >
            ดำเนินการต่อ
          </button>
        </div>
      </div>

      {/* Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmOpen(false)} />
          <div className="relative h-full w-full grid place-items-center p-4">
            <div
              className="w-[92%] max-w-sm rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-24 h-24 rounded-2xl bg-orange-50 mx-auto grid place-items-center mb-4">
                <CheckCircle2 className="w-12 h-12" style={{ color: "#27AE60" }} />
              </div>
              <h3 id="confirm-title" className="text-2xl font-semibold text-slate-900 text-center">
                ยืนยันการเรียกเช็คบิล
              </h3>
              <div
                className="mt-3 rounded-2xl px-4 py-3 text-center text-[15px]"
                style={{ background: "#FFF2EA", color: "#F4935E", border: "1px solid #FFD8C5" }}
              >
                โปรดทราบ หากเรียกเช็คบิลแล้ว<br />คุณจะไม่สามารถสั่งอาหารเพิ่มได้
              </div>
              {err && <p className="mt-3 text-center text-rose-600 text-sm">{err}</p>}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  className="rounded-2xl py-3 font-semibold border"
                  style={{ borderColor: "#F4935E", color: "#F4935E" }}
                  onClick={() => setConfirmOpen(false)}
                  disabled={confirming}
                >
                  ยกเลิก
                </button>
                <button
                  className="rounded-2xl py-3 font-semibold text-white disabled:opacity-60"
                  style={{ background: "#F4935E" }}
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? "กำลังส่ง..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
