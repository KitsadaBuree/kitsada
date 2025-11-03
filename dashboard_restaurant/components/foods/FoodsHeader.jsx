"use client";
import { UtensilsCrossed, Settings } from "lucide-react";

export default function FoodsHeader({ serviceRate = 2.5, onEditServiceRate }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {/* Title + Icon */}
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-600 ring-1 ring-orange-200">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">รายการอาหาร</h1>
        </div>

        {/* Service charge pill */}
        <button
          onClick={onEditServiceRate}
          title="แก้ไขค่า Service Charge"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Service Charge</span>
          <span className="font-medium text-slate-900">
            {Number(serviceRate).toFixed(2)}%
          </span>
          <Settings className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}
