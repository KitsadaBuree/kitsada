// components/reports/ReportHeader.jsx
"use client";
import { UtensilsCrossed, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export default function ReportHeader({
  granularity, setGranularity,
  date, setDate,
  onPrev, onNext,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-8 h-64 w-64 rounded-full bg-emerald-200/25 blur-3xl" />

      <div className="relative flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-600 text-white shadow ring-1 ring-orange-400/60">
          <UtensilsCrossed className="h-5 w-5" />
        </span>

        <div className="mr-auto">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">แดชบอร์ดเมนู</h1>
          <p className="text-xs text-slate-600">สรุปยอดแบบภาพรวม + แนวโน้มตามเมนู</p>
        </div>

        {/* สวิตช์ วัน/เดือน/ปี */}
        <div className="inline-flex rounded-xl border border-orange-200 bg-white p-1 shadow-sm">
          {["day","month","year"].map(k => (
            <button
              key={k}
              onClick={()=>{
                setGranularity(k);
                const now=new Date();
                const y=now.getFullYear(), m=String(now.getMonth()+1).padStart(2,"0"), d=String(now.getDate()).padStart(2,"0");
                setDate(k==="day"?`${y}-${m}-${d}`:k==="month"?`${y}-${m}-01`:`${y}-01-01`);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                granularity===k ? "bg-orange-600 text-white" : "text-slate-700 hover:bg-orange-50"
              }`}
            >
              {k==="day"?"วัน":k==="month"?"เดือน":"ปี"}
            </button>
          ))}
        </div>

        {/* ปุ่มเลื่อนช่วงเวลา + เลือกวันที่ */}
        <button onClick={onPrev} className="rounded-xl border border-orange-200 bg-white p-2 shadow-sm hover:bg-orange-50">
          <ChevronLeft className="h-4 w-4 text-orange-600" />
        </button>

        <span className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm shadow-sm">
          <CalendarDays className="h-4 w-4 text-orange-600" />
          {granularity!=="year" ? (
            <input
              type={granularity==="day"?"date":"month"}
              value={granularity==="day"?date:date.slice(0,7)}
              onChange={(e)=>setDate(granularity==="day"?e.target.value:`${e.target.value}-01`)}
              className="outline-none"
            />
          ) : (
            <input
              type="number" min="2000" max="2100"
              value={date.slice(0,4)}
              onChange={(e)=>setDate(`${e.target.value}-01-01`)}
              className="w-[88px] outline-none"
            />
          )}
        </span>

        <button onClick={onNext} className="rounded-xl border border-orange-200 bg-white p-2 shadow-sm hover:bg-orange-50">
          <ChevronRight className="h-4 w-4 text-orange-600" />
        </button>
      </div>
    </div>
  );
}
