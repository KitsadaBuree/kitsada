// components/reports/SalesKPI.jsx
"use client";

import { BadgeDollarSign } from "lucide-react";

export default function SalesKPI({
  amount = 0,
  caption = "รวมยอดขายในช่วงที่เลือก",
}) {
  const fmt = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-white px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
        <span className="grid h-4 w-4 place-items-center rounded bg-sky-100 text-sky-700">
          <BadgeDollarSign className="h-3 w-3" />
        </span>
        ยอดขายรวม (บาท)
      </div>
      <div className="text-4xl font-semibold leading-none text-slate-800 tabular-nums">
        {fmt.format(Number(amount || 0))}
      </div>
      <div className="mt-1 text-xs text-slate-500">{caption}</div>
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ring-1 ring-sky-200 blur-2xl" />
    </div>
  );
}
