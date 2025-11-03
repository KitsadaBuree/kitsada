// components/reports/WeekdayPattern.jsx
"use client";
import {ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid} from "recharts";

export default function WeekdayPattern({ data=[], yLabel="จำนวนจาน (รวมทุกเมนู)" }) {
  const series = data.map(r => ({
    weekday: r.weekday,
    total: Object.entries(r).reduce((s,[k,v]) => k!=="weekday" ? s+Number(v||0) : s, 0)
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 font-semibold text-slate-800">พฤติกรรมรายวัน (จันทร์–อาทิตย์)</div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis dataKey="weekday" tick={{fontSize:12}} />
            <YAxis tick={{fontSize:12}} width={48} />
            <Tooltip />
            <Bar dataKey="total" radius={[6,6,0,0]} fill="#fb923c" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-xs text-slate-400">
        ใช้เดาว่าช่วงวันไหนควรสต็อกวัตถุดิบเมนูฮิต (หรือวางโปรโมชันประจำวัน)
      </div>
    </div>
  );
}
