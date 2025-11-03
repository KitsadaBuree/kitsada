"use client";
import React from "react";
import { Layers } from "lucide-react";

export default function PlatesKPI({
  platesCount = 0,
  caption = "รวมทุกเมนู/ทุกโต๊ะ ในช่วงที่เลือก",
}) {
  const nf = new Intl.NumberFormat("th-TH");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* header pill */}
      <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">
        <Layers className="h-4 w-4" />
        วันนี้ขายได้กี่อย่าง (จำนวนจาน)
      </div>

      {/* value */}
      <div className="text-5xl font-semibold leading-none text-slate-900 tabular-nums">
        {nf.format(Number(platesCount || 0))}
      </div>

      {/* caption */}
      <div className="mt-1 text-xs text-slate-500">{caption}</div>
    </div>
  );
}
