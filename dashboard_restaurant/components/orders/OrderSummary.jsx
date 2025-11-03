// components/orders/OrderSummary.jsx
"use client";

export default function OrderSummary({ subtotal, serviceRate = 0, onReview }) {
  const service = subtotal * serviceRate;
  const total = subtotal + service;

  const fmt = (n) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n || 0);

  return (
    <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 md:w-[420px]">
      <div className="flex items-center justify-between">
        <span className="text-slate-600">ยอดก่อนคิดค่าบริการ</span>
        <span className="tabular-nums font-medium">{fmt(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-600">ค่าบริการ ({Math.round(serviceRate * 100)}%)</span>
        <span className="tabular-nums font-medium">{fmt(service)}</span>
      </div>
      <hr className="my-1" />
      <div className="flex items-center justify-between text-lg">
        <span className="font-semibold">ยอดรวม</span>
        <span className="tabular-nums font-semibold text-orange-600">{fmt(total)}</span>
      </div>
      <button
        onClick={onReview}
        disabled={subtotal <= 0}
        className="mt-2 rounded-xl bg-orange-500 px-4 py-3 font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        ชำระเงิน / ตรวจสอบก่อนสั่ง
      </button>
    </div>
  );
}
