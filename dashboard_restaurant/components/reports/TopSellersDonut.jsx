// components/reports/TopSellersDonut.jsx
"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Label,
} from "recharts";
import { Flame } from "lucide-react";

/** items: [{ name, percent?, orders? }] */
export default function TopSellersDonut({
  items = [],
  showPercent = true,       // true = ใช้ percent, false = ใช้ orders
  unit = "%",               // หน่วยถ้าเป็นเปอร์เซ็นต์
}) {
  // เตรียมข้อมูล (กรองค่า 0, จัดเรียงมาก→น้อย)
  const rows = useMemo(() => {
    const mapped = (items || []).map((it) => ({
      name: String(it.name ?? "").trim() || "(ไม่ระบุ)",
      value: showPercent ? Math.max(0, Math.min(100, Number(it.percent || 0)))
                         : Math.max(0, Number(it.orders || 0)),
    }));
    return mapped.filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  }, [items, showPercent]);

  const total = useMemo(
    () => rows.reduce((s, r) => s + r.value, 0),
    [rows]
  );

  // พาเลตต์สีโทนอุ่น-สด + ไล่เฉด (วนเมื่อรายการเกิน)
  const COLORS = [
    ["#FDBA74", "#FB923C"], // ส้มพีช
    ["#60A5FA", "#3B82F6"], // ฟ้า
    ["#34D399", "#10B981"], // เขียวมิ้นต์
    ["#A78BFA", "#8B5CF6"], // ม่วง
    ["#F472B6", "#EC4899"], // ชมพู
    ["#22D3EE", "#06B6D4"], // ฟ้าน้ำทะเล
    ["#FCD34D", "#F59E0B"], // เหลือง
    ["#4ADE80", "#22C55E"], // เขียว
  ];

  // ป้ายกลางวง
  const CenterLabel = () => {
    const title = showPercent ? "รวม (หน่วย %)" : "รวม (หน่วยจาน)";
    const big = showPercent ? "100%" : String(total);
    return (
      <g>
        <text x="50%" y="46%" textAnchor="middle" fill="#475569" fontSize={13}>
          {title}
        </text>
        <text x="50%" y="58%" textAnchor="middle" fill="#0f172a" fontSize={28} fontWeight={800}>
          {big}
        </text>
      </g>
    );
  };

  // ป้ายด้านนอกแต่ละชิ้น (ชื่อ + ค่า)
  const OutsideLabel = ({ name, percent, value, cx, x, y }) => {
    const txt = showPercent
      ? `${name} (${Math.round(percent * 100)}%)`
      : `${name} (${value})`;
    return (
      <text x={x} y={y} fill="#0f172a" fontSize={14} textAnchor={x > cx ? "start" : "end"}>
        {txt}
      </text>
    );
  };

  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100 text-orange-600">
            <Flame className="h-4 w-4" />
          </span>
          <div className="text-lg font-semibold">เมนูขายดี (สัดส่วน)</div>
        </div>
        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
          หน่วย: {showPercent ? unit : "จาน"}
        </span>
      </div>

      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* เงานุ่มสำหรับโดนัท */}
            <defs>
              <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.15" />
              </filter>
              {COLORS.map(([c1, c2], i) => (
                <linearGradient key={i} id={`donutGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={c1} />
                  <stop offset="100%" stopColor={c2} />
                </linearGradient>
              ))}
            </defs>

            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="78%"
              paddingAngle={2}
              cornerRadius={6}
              isAnimationActive={false}
              labelLine={{ stroke: "#E2E8F0", strokeWidth: 1.5 }}
              label={(p) => (
                <OutsideLabel {...p} percent={p.percent} cx={p.cx} />
              )}
            >
              {rows.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  filter="url(#softShadow)"
                  fill={`url(#donutGrad-${i % COLORS.length})`}
                />
              ))}

              {/* ป้ายกลางวง */}
              <Label position="center" content={<CenterLabel />} />
            </Pie>

            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.02)" }}
              formatter={(v, _n, p) =>
                showPercent ? [`${v}${unit}`, p?.payload?.name] : [v, p?.payload?.name]
              }
              contentStyle={{
                borderRadius: 10,
                borderColor: "#f1f5f9",
                boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              }}
              labelStyle={{ color: "#0f172a" }}
            />

            {/* ตำนานแบบแถวเดียวด้านล่าง */}
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ paddingTop: 10 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-xs leading-relaxed text-slate-500">
        เคล็ดลับ: โหมด “โดนัท” ใช้ดูภาพรวมสัดส่วนอย่างเร็ว ๆ และเน้น “อันดับ” ของเมนูยอดนิยม
      </div>
    </div>
  );
}
