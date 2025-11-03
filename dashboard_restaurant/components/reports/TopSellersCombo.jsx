// components/reports/TopSellersCombo.jsx
"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, LabelList,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Flame } from "lucide-react";

const PALETTE = [
  ["#FDBA74", "#FB923C"],
  ["#60A5FA", "#3B82F6"],
  ["#34D399", "#10B981"],
  ["#A78BFA", "#8B5CF6"],
  ["#F472B6", "#EC4899"],
  ["#22D3EE", "#06B6D4"],
  ["#FCD34D", "#F59E0B"],
  ["#4ADE80", "#22C55E"],
  ["#FCA5A5", "#EF4444"],
  ["#93C5FD", "#60A5FA"],
];

/** items: [{ name, orders, percent? }] */
export default function TopSellersCombo({
  items = [],
  topN = 5,
  periodLabel = "",
}) {
  // โหมดดูแท่ง/โดนัท (ทั้งคู่จะแสดง “จำนวนจาน”)
  const [mode, setMode] = useState("bar");
  const nf = useMemo(() => new Intl.NumberFormat("th-TH"), []);

  // เตรียมข้อมูล: ใช้จำนวนจาน (orders) ล้วน ๆ
  const rowsAll = useMemo(() => {
    return (Array.isArray(items) ? items : [])
      .map((it, i) => ({
        name: String(it?.name ?? "").trim() || "(ไม่ระบุ)",
        valueQty: Math.max(0, Number(it?.orders ?? 0)),
        idx: i,
      }))
      .filter(r => r.valueQty > 0)
      .sort((a, b) => b.valueQty - a.valueQty);
  }, [items]);

  const rows = useMemo(() => rowsAll.slice(0, Math.max(1, topN)), [rowsAll, topN]);

  const yWidth = useMemo(() => {
    const maxLen = Math.max(0, ...rows.map(r => r.name.length));
    return Math.min(340, Math.max(220, Math.round(maxLen * 9)));
  }, [rows]);

  // ป้ายตัวเลขท้ายแท่ง = “{จำนวน} จาน”
  const BarEndLabel = ({ x = 0, y = 0, width = 0, height = 0, value }) => {
    const text = `${nf.format(value)} จาน`;
    const inside = width >= 72;
    const tx = inside ? x + width - 8 : x + width + 8;
    const ty = y + height / 2 + 1;
    const pillW = text.length * 6 + 14;
    return (
      <g>
        {!inside && (
          <rect x={tx - 6} y={ty - 10} rx={8} ry={8} width={pillW} height={20} fill="#fff" stroke="#e2e8f0" />
        )}
        <text
          x={tx}
          y={ty}
          textAnchor={inside ? "end" : "start"}
          dominantBaseline="middle"
          fontSize={12}
          fontWeight={700}
          fill={inside ? "#fff" : "#334155"}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {text}
        </text>
      </g>
    );
  };

  // ป้ายด้านนอกชิ้นโดนัท = ชื่อเมนู + จำนวนจาน
  const DonutOutsideLabel = (p) => {
    const { name, cx, x, y } = p;
    const qty = p?.payload?.valueQty ?? 0;
    return (
      <text x={x} y={y} fill="#0f172a" fontSize={13} textAnchor={x > cx ? "start" : "end"}>
        {name} ({nf.format(qty)} จาน)
      </text>
    );
  };

  const LegendPills = () => (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {rows.map(r => {
        const [c1, c2] = PALETTE[r.idx % PALETTE.length];
        return (
          <span
            key={r.name}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
            />
            {r.name}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100 text-orange-600">
            <Flame className="h-4 w-4" />
          </span>
          <div className="text-lg font-semibold">
            เมนูขายดี (Top {topN}) • {periodLabel}
          </div>
          <span className="ml-2 rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500">
            หน่วย: จาน
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 p-1 text-sm">
          <button
            onClick={() => setMode("bar")}
            className={`rounded-full px-3 py-1 ${mode==="bar" ? "bg-white text-orange-600 shadow-sm" : "text-orange-700/70 hover:text-orange-700"}`}
          >
            แท่ง
          </button>
          <button
            onClick={() => setMode("donut")}
            className={`rounded-full px-3 py-1 ${mode==="donut" ? "bg-white text-orange-600 shadow-sm" : "text-orange-700/70 hover:text-orange-700"}`}
          >
            โดนัท
          </button>
        </div>
      </div>

      <div className="relative h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "bar" ? (
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 8, right: 140, left: 8, bottom: 8 }}
              barCategoryGap={12}
              barGap={6}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
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
                domain={[0, (mx) => Math.ceil(mx * 1.1)]}   // ✅ สเกลตามจำนวนจานสูงสุด
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={(v) => nf.format(v)}
              />
              <ReferenceLine x={0} stroke="#e5e7eb" />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                formatter={(_v, _n, ctx) => {
                  const qty = ctx?.payload?.valueQty ?? 0;
                  return [`${nf.format(qty)} จาน`, ctx?.payload?.name];
                }}
                labelClassName="text-slate-700"
                contentStyle={{ borderRadius: 10, borderColor: "#f1f5f9", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}
              />
              <Bar dataKey="valueQty" radius={[10, 10, 10, 10]} barSize={20} fill="url(#barGrad)">
                <LabelList dataKey="valueQty" content={<BarEndLabel />} />
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <defs>
                <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.15" />
                </filter>
                {PALETTE.map(([c1, c2], i) => (
                  <linearGradient key={i} id={`donutGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={c1} />
                    <stop offset="100%" stopColor={c2} />
                  </linearGradient>
                ))}
              </defs>

              <Pie
                data={rows}
                dataKey="valueQty"      // ✅ ใช้จำนวนจาน
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="78%"
                paddingAngle={2}
                cornerRadius={6}
                isAnimationActive={false}
                labelLine={{ stroke: "#E2E8F0", strokeWidth: 1.5 }}
                label={(p) => <DonutOutsideLabel {...p} />}
              >
                {rows.map((r) => (
                  <Cell
                    key={r.name}
                    filter="url(#softShadow)"
                    fill={`url(#donutGrad-${r.idx % PALETTE.length})`}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(_v, _n, ctx) => {
                  const qty = ctx?.payload?.valueQty ?? 0;
                  return [`${nf.format(qty)} จาน`, ctx?.payload?.name];
                }}
                contentStyle={{ borderRadius: 10, borderColor: "#f1f5f9", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}
                labelStyle={{ color: "#0f172a" }}
              />
              <Legend verticalAlign="bottom" align="center" content={() => <LegendPills />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-xs text-slate-400">
        เคล็ดลับ: ใช้โหมด “โดนัท” เพื่อดูภาพรวม แล้วสลับ “แท่ง” เมื่ออยากเทียบชื่อเมนู/อันดับแบบอ่านง่าย
      </div>
    </div>
  );
}
