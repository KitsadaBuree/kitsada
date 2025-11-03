// components/reports/MenuMultiLine.jsx
"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

const COLORS = [
  "#ef4444", "#22c55e", "#06b6d4", "#f59e0b", "#8b5cf6",
  "#0ea5e9", "#84cc16", "#f97316", "#14b8a6", "#a855f7",
];

const nf = new Intl.NumberFormat("th-TH");

export default function MenuMultiLine({
  data = [],
  menus = [],
  yLabel = "จำนวนจาน",
  height = 420,
  showLegendPills = true,
}) {
  // === คำนวณยอดสะสมเสมอ ===
  const cumData = useMemo(() => {
    if (!data?.length || !menus?.length) return [];

    const keyOf = (row) => row.label ?? row.date ?? "";
    const sorted = [...data].sort((a, b) => (keyOf(a) > keyOf(b) ? 1 : -1));
    const sum = Object.fromEntries(menus.map((m) => [m, 0]));

    return sorted.map((row) => {
      const out = { label: keyOf(row) };
      menus.forEach((m) => {
        const v = Number(row[m] ?? 0);
        sum[m] += v;
        out[m] = sum[m];
      });
      return out;
    });
  }, [data, menus]);

  // รวมจานของแต่ละจุด (ไว้โชว์ใน tooltip สรุป)
  const totalKey = "__total__";
  const chartData = useMemo(() => {
    return cumData.map((r) => ({
      ...r,
      [totalKey]: menus.reduce((s, m) => s + Number(r[m] || 0), 0),
    }));
  }, [cumData, menus]);

  if (!chartData.length) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
        <div className="mb-2 font-semibold text-slate-800">
          ยอดขายตามช่วงเวลา (แยกตามเมนู) — <span className="text-orange-600">ยอดสะสม</span>
        </div>
        <div className="grid h-40 place-items-center text-slate-400 text-sm">
          ยังไม่มีข้อมูลในช่วงนี้
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="font-semibold text-slate-800">
          ยอดขายตามช่วงเวลา (แยกตามเมนู)
          <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-200">
            ยอดสะสม
          </span>
        </div>

        {showLegendPills && (
          <div className="flex flex-wrap items-center gap-2">
            {menus.map((m, i) => (
              <span
                key={m}
                className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`h-[${height}px]`}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              // ถ้าจุดเยอะ ลดจำนวน tick อัตโนมัติให้อ่านง่าย
              interval={chartData.length > 12 ? "preserveStartEnd" : 0}
              minTickGap={chartData.length > 12 ? 24 : 0}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              width={48}
              tickFormatter={(v)=> nf.format(v)}
              label={
                yLabel
                  ? { value: yLabel, angle: -90, position: "insideLeft", offset: 10 }
                  : undefined
              }
            />

            {/* Tooltip สรุปสวยๆ */}
            <Tooltip
              formatter={(v, name) => [nf.format(v), name]}
              labelFormatter={(l) => `วันที่ ${l}`}
              contentStyle={{
                borderRadius: 10,
                borderColor: "#e5e7eb",
                boxShadow: "0 4px 14px rgba(0,0,0,.08)",
              }}
            />

            {/* เส้นเมนู */}
            {menus.map((m, i) => (
              <Line
                key={m}
                type="monotone"
                dataKey={m}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-xs text-slate-400">
        ใช้ดู pattern ของแต่ละเมนูแบบสะสม ว่าวันไหนเริ่มนำ/แซง เพื่อวางแผนเตรียมวัตถุดิบให้พอดี
      </div>
    </div>
  );
}
