// components/reports/TopSellersBig.jsx
"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid,
  XAxis, YAxis, Tooltip, ReferenceLine, LabelList,
} from "recharts";
import { Flame } from "lucide-react";

/** items: [{ name, percent?, orders? }] */
export default function TopSellersBig({
  items = [],
  showPercent = true,              // true = ใช้ percent, false = ใช้ orders
  unit = "%",                      // หน่วยที่แสดง
  rightPad = 120,                  // เว้นที่ด้านขวาให้ป้ายตัวเลข
  modeLabel = "ช่วงที่เลือก",     // ป้ายแคปซูลขวาบน (เช่น “ยอดสะสม” / “ช่วงที่เลือก”)
}) {
  const nf = useMemo(() => new Intl.NumberFormat("th-TH"), []);

  // เตรียมข้อมูล (จัดจากมาก→น้อย, clamp % ให้อยู่ 0–100)
  const rows = useMemo(
    () =>
      (items || [])
        .map((it) => {
          const raw = showPercent ? Number(it.percent ?? 0) : Number(it.orders ?? 0);
          return {
            name: String(it.name ?? "").trim() || "(ไม่ระบุ)",
            value: showPercent ? Math.min(100, Math.max(0, raw)) : Math.max(0, raw),
          };
        })
        .sort((a, b) => b.value - a.value),
    [items, showPercent]
  );

  // ความกว้างแกนชื่อเมนู (ซ้าย)
  const yWidth = useMemo(() => {
    const maxLen = Math.max(0, ...rows.map((r) => r.name.length));
    return Math.min(340, Math.max(220, Math.round(maxLen * 9.5)));
  }, [rows]);

  // ป้ายตัวเลขปลายแท่ง (อยู่ใน/นอกแท่งอัตโนมัติ)
  const ValuePill = ({ x = 0, y = 0, width = 0, height = 0, value }) => {
    const label = showPercent ? `${nf.format(value)}${unit}` : nf.format(value);
    const inside = width >= 64;
    const textX = inside ? x + width - 8 : x + width + 8;
    const textY = y + height / 2 + 1;
    const pillW = label.length * 6 + 14;

    return (
      <g>
        {!inside && (
          <rect
            x={textX - 6}
            y={textY - 10}
            rx={8}
            ry={8}
            width={pillW}
            height={20}
            fill="#fff"
            stroke="#e2e8f0"
          />
        )}
        <text
          x={textX}
          y={textY}
          textAnchor={inside ? "end" : "start"}
          dominantBaseline="middle"
          fontSize={12}
          fontWeight={700}
          fill={inside ? "#fff" : "#334155"}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {label}
        </text>
      </g>
    );
  };

  // กรณีไม่มีข้อมูล
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100 text-orange-600 ring-1 ring-orange-200/60">
              <Flame className="h-4 w-4" />
            </span>
            <div className="text-lg font-semibold">เมนูขายดี (สัดส่วน {unit})</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              {modeLabel}
            </span>
            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
              หน่วย: {unit}
            </span>
          </div>
        </div>

        <div className="grid h-[420px] place-items-center text-slate-400">
          ยังไม่มีข้อมูลสำหรับช่วงนี้
        </div>
      </div>
    );
  }

  // ใช้ id unique กันชนกับกราฟอื่น ๆ
  const gradId = "barGradTopSellers";

  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100 text-orange-600 ring-1 ring-orange-200/60">
            <Flame className="h-4 w-4" />
          </span>
          <div className="text-lg font-semibold">เมนูขายดี (สัดส่วน {unit})</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
            {modeLabel}
          </span>
          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
            หน่วย: {unit}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[420px] w-full" aria-label="Top sellers bar chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 8, right: rightPad, left: 8, bottom: 8 }}
            barCategoryGap={12}
            barGap={6}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fdba74" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />

            <YAxis
              type="category"
              dataKey="name"
              width={yWidth}
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{ fontSize: 14, fontWeight: 600, fill: "#0f172a" }}
            />

            <XAxis
              type="number"
              domain={showPercent ? [0, 100] : [0, (mx) => Math.ceil(mx * 1.1)]}
              ticks={showPercent ? [0, 25, 50, 75, 100] : undefined}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(v) => (showPercent ? `${v}` : nf.format(v))}
            />

            <ReferenceLine x={0} stroke="#e5e7eb" />

            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              formatter={(v) => [showPercent ? `${nf.format(v)}${unit}` : nf.format(v), "ค่า"]}
              labelClassName="text-slate-700"
              contentStyle={{
                borderRadius: 10,
                borderColor: "#f1f5f9",
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              }}
            />

            <Bar
              dataKey="value"
              radius={[10, 10, 10, 10]}
              barSize={20}
              fill={`url(#${gradId})`}
            >
              <LabelList content={<ValuePill />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* คำแนะนำการอ่านกราฟ */}
      <div className="mt-3 text-xs leading-relaxed text-slate-500">
        <div className="mb-1 font-medium text-slate-600">วิธีดูกราฟ:</div>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>แท่งยิ่งยาว → เมนูนั้นขายดีขึ้นในช่วงเวลาที่เลือก</li>
          <li>ตัวเลขปลายแท่งคือสัดส่วนของเมนูนั้น (หน่วย {unit})</li>
          <li>ใช้เทียบเมนูยอดนิยม เพื่อวางแผนสต็อก/โปรโมชันให้โดน</li>
          <li>ลองเปลี่ยนช่วงเวลา (วัน/เดือน/ปี) เพื่อดู pattern ตามฤดูกาล</li>
        </ul>
      </div>
    </div>
  );
}
