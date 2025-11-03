// components/reports/OrdersKPI.jsx
"use client";

import { Receipt } from "lucide-react";

export default function OrdersKPI({
  count = 0,
  caption = "นับเฉพาะบิลที่ชำระแล้ว",
}) {
  const nf = new Intl.NumberFormat("th-TH");
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-white px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
        <span className="grid h-4 w-4 place-items-center rounded bg-indigo-100 text-indigo-700">
          <Receipt className="h-3 w-3" />
        </span>
        จำนวนบิล / ออเดอร์
      </div>
      <div className="text-4xl font-semibold leading-none text-slate-800 tabular-nums">
        {nf.format(Number(count || 0))}
      </div>
      <div className="mt-1 text-xs text-slate-500">{caption}</div>
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ring-1 ring-indigo-200 blur-2xl" />
    </div>
  );
}
