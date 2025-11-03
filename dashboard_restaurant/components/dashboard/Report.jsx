"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, AreaChart, Area
} from "recharts";
import {
  LayoutDashboard, CalendarDays, ChevronLeft, ChevronRight,
  Layers, Flame, BadgeDollarSign, TrendingUp
} from "lucide-react";

/* -------------------- Utils -------------------- */
const COLORS = ["#fb923c","#22c55e","#3b82f6","#f43f5e","#a855f7","#06b6d4","#f59e0b","#64748b"];
const fmtInt  = (n) => new Intl.NumberFormat("th-TH").format(Number(n||0));
const fmtTHB  = (n) => new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB"}).format(Number(n||0));
const months  = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function thaiHeader(dateIso, g="day"){
  const d = new Date(dateIso || new Date().toISOString().slice(0,10));
  const be = d.getFullYear() + 543;
  if (g==="day")   return `${d.getDate()} ${months[d.getMonth()]} ${be}`;
  if (g==="month") return `${months[d.getMonth()]} ${be}`;
  return String(be);
}
function shiftDate(baseIso, g, step){
  const dt = new Date(baseIso);
  if (g==="day")   dt.setDate(dt.getDate()+step);
  if (g==="month") dt.setMonth(dt.getMonth()+step,1);
  if (g==="year")  dt.setFullYear(dt.getFullYear()+step,1);
  const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,"0"), d=String(dt.getDate()).padStart(2,"0");
  if (g==="day")   return `${y}-${m}-${d}`;
  if (g==="month") return `${y}-${m}-01`;
  return `${y}-01-01`;
}
async function safeJsonFetch(url){ const r=await fetch(url,{cache:"no-store"}); const t=await r.text(); if(!r.ok) throw new Error(t||`HTTP ${r.status}`); return JSON.parse(t||"{}"); }

/* -------------------- Subcomponents -------------------- */
function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm ring-1 transition ${
        active ? "bg-orange-600 text-white ring-orange-500"
               : "bg-white text-slate-700 ring-slate-300 hover:bg-orange-50"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, icon, right, children }) {
  return (
    <div className="rounded-3xl border border-orange-200/60 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-white ring-1 ring-orange-400/60">
            {icon}
          </span>
          {title}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* -------------------- Page -------------------- */
export default function BigReportPage() {
  /** Filters */
  const [g, setG] = useState("day"); // day | month | year
  const [date, setDate] = useState(()=>new Date().toISOString().slice(0,10));

  /** Graph states */
  const [mode, setMode] = useState("qty");        // qty | amount
  const [cumulative, setCumulative] = useState(false);

  /** Data */
  const [kpi, setKpi] = useState({ sales:0, plates:0 });
  const [seriesByMenu, setSeriesByMenu] = useState([]); // [{name, points:[{iso, qty, amount}], color}]
  const [topSellers, setTopSellers] = useState([]);     // [{name, percent}]
  const [dailyTotal, setDailyTotal] = useState([]);     // [{label, amount}]
  const [loading, setLoading] = useState(true);

  /** Load from APIs (ปรับ endpoint ให้ตรง backend ของคุณ) */
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try {
        const qs = new URLSearchParams({ granularity:g, date }).toString();

        // 1) KPI รวม + daily totals (ของเดิมจาก /api/reports/summary)
        const sum = await safeJsonFetch(`/api/reports/summary?${qs}`);
        const hist = sum?.data?.salesByDate || [];
        setDailyTotal(hist.map(x=>({ label:x.label || x.date || x.iso, amount:Number(x.amount||0) })));
        setKpi({
          sales: Number(sum?.data?.todaySales || 0),
          plates: Number(sum?.data?.todayMenuCount || 0), // จะถูกแทนด้วย qty รวมของวันนี้ด้านล่างถ้ามี timeseries
        });
        setTopSellers(sum?.data?.topSellers || []);

        // 2) timeseries แยกตามเมนู (ใหม่): ส่งกลับ [{name, points:[{iso, qty, amount}], color?}]
        //    หากยังไม่มี API นี้ ให้ล็อกค่าทดสอบไว้ก่อน
        try {
          const ms = await safeJsonFetch(`/api/reports/menu-timeseries?${qs}&limit=8`);
          setSeriesByMenu(ms?.data || []);
        } catch {
          // fallback mock (ลบหลังมี API จริง)
          const mock = ["กระเพราหมู","ข้าวผัด","ราดหน้า","ต้มยำกุ้ง","ผัดพริกแกง","คะน้าหมูกรอบ"].map((n,i)=>({
            name:n,
            points:Array.from({length:10}).map((_,d)=>({
              iso: new Date(new Date(date).getTime() - (9-d)*86400000).toISOString().slice(0,10),
              qty:  Math.max(0, Math.round(6 + Math.sin((d+i)*1.7)*4 + (i%3?2:-1))),
              amount: Math.max(0, Math.round(120 + Math.sin((d+i)*1.2)*60 + i*20)),
            })),
            color: COLORS[i%COLORS.length],
          }));
          setSeriesByMenu(mock);
        }
      } finally { setLoading(false); }
    })();
  }, [g, date]);

  /** Compose multi-line chart data */
  const allDates = useMemo(()=>{
    const s = new Set();
    seriesByMenu.forEach(m => (m.points||[]).forEach(p => s.add(p.iso?.slice(0,10))));
    return [...s].sort();
  }, [seriesByMenu]);

  const menuChartData = useMemo(()=>{
    const rows = allDates.map(iso=>({ iso, label: iso }));
    seriesByMenu.forEach(m=>{
      let run = 0;
      const map = new Map((m.points||[]).map(p=>[p.iso?.slice(0,10), p]));
      rows.forEach(r=>{
        const v = Number(map.get(r.iso)?.[mode] || 0);
        run += v;
        r[m.name] = cumulative ? run : v;
      });
    });
    return rows;
  }, [allDates, seriesByMenu, mode, cumulative]);

  /** Plates of TODAY from timeseries (แทนค่าจาก summary ถ้าเจอ) */
  const todayPlates = useMemo(()=>{
    const iso = date.slice(0,10);
    let sum = 0;
    seriesByMenu.forEach(m=>{
      const hit = (m.points||[]).find(p => p.iso?.slice(0,10)===iso);
      sum += Number(hit?.qty || 0);
    });
    return sum || kpi.plates;
  }, [seriesByMenu, date, kpi.plates]);

  return (
    <div className="mx-auto w-full max-w-[1400px] p-8 space-y-8">
      {/* ---------------- Hero Header ---------------- */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-600 text-white shadow ring-1 ring-orange-500/60">
            <LayoutDashboard className="h-6 w-6" />
          </span>
          <div className="mr-auto">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">แดชบอร์ดสรุปยอดขาย</h1>
            <p className="text-sm text-slate-600">
              ช่วง: <span className="font-medium">{thaiHeader(date, g)}</span>
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={g==="day"}   onClick={()=>setG("day")}>รายวัน</Chip>
            <Chip active={g==="month"} onClick={()=>setG("month")}>รายเดือน</Chip>
            <Chip active={g==="year"}  onClick={()=>setG("year")}>รายปี</Chip>

            <button
              className="rounded-xl border border-orange-200 bg-white p-2 shadow-sm hover:bg-orange-50"
              onClick={()=> setDate(shiftDate(date, g, -1))}
              aria-label="ก่อนหน้า"
            >
              <ChevronLeft className="h-5 w-5 text-orange-600" />
            </button>

            <span className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm shadow-sm">
              <CalendarDays className="h-5 w-5 text-orange-600" />
              {g!=="year" ? (
                <input
                  type={g==="day"?"date":"month"}
                  value={g==="day"?date:date.slice(0,7)}
                  onChange={(e)=> setDate(g==="day"?e.target.value:`${e.target.value}-01`)}
                  className="outline-none"
                />
              ) : (
                <input
                  type="number" min="2000" max="2100"
                  value={date.slice(0,4)}
                  onChange={(e)=> setDate(`${e.target.value}-01-01`)}
                  className="w-[92px] outline-none"
                />
              )}
            </span>

            <button
              className="rounded-xl border border-orange-200 bg-white p-2 shadow-sm hover:bg-orange-50"
              onClick={()=> setDate(shiftDate(date, g, +1))}
              aria-label="ถัดไป"
            >
              <ChevronRight className="h-5 w-5 text-orange-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- KPI Big Cards ---------------- */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full bg-emerald-100/70 blur-2xl" />
          <div className="flex items-center gap-2 text-slate-600">
            <BadgeDollarSign className="h-5 w-5 text-emerald-600" /> ยอดขาย{g==="day"?"วันนี้":g==="month"?"เดือนนี้":"ปีนี้"}
          </div>
          <div className="mt-2 text-5xl font-semibold tabular-nums text-emerald-600">{fmtTHB(kpi.sales)}</div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full bg-orange-100/70 blur-2xl" />
          <div className="flex items-center gap-2 text-slate-600">
            <Flame className="h-5 w-5 text-orange-600" /> จำนวน<strong className="mx-1">จาน</strong>ที่สั่ง{g==="day"?"วันนี้":g==="month"?"เดือนนี้":"ปีนี้"}
          </div>
          <div className="mt-2 text-5xl font-semibold tabular-nums text-orange-600">{fmtInt(todayPlates)}</div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full bg-sky-100/70 blur-2xl" />
          <div className="flex items-center gap-2 text-slate-600">
            <TrendingUp className="h-5 w-5 text-sky-600" /> ยอดขายรวมช่วงที่เลือก
          </div>
          <div className="mt-2 text-5xl font-semibold tabular-nums text-sky-600">
            {fmtTHB(dailyTotal.reduce((s,r)=>s+Number(r.amount||0),0))}
          </div>
        </div>
      </div>

      {/* ---------------- Multi-series Menu Trend (BIG) ---------------- */}
      <Section
        title="แนวโน้มตามเมนู (ใหญ่)"
        icon={<Layers className="h-5 w-5" />}
        right={
          <div className="flex items-center gap-2">
            <Chip active={mode==="qty"}    onClick={()=>setMode("qty")}>จำนวนจาน</Chip>
            <Chip active={mode==="amount"} onClick={()=>setMode("amount")}>ยอดขาย (บาท)</Chip>
            <label className="ml-2 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cumulative} onChange={e=>setCumulative(e.target.checked)} />
              แสดงแบบสะสม
            </label>
          </div>
        }
      >
        <div className="h-[420px]">
          {loading ? (
            <div className="grid h-full place-items-center text-slate-400">กำลังโหลด…</div>
          ) : menuChartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={menuChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={64} />
                <Tooltip
                  formatter={(v,name)=> mode==="qty" ? [fmtInt(v), name] : [fmtTHB(v), name]}
                  labelFormatter={(l)=>`วันที่ ${l}`}
                />
                <Legend />
                {seriesByMenu.map((m,i)=>(
                  <Line
                    key={m.name}
                    type="monotone"
                    dataKey={m.name}
                    stroke={m.color || COLORS[i%COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 2.5 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-slate-400">ยังไม่มีข้อมูลในช่วงนี้</div>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          ใช้ดู pattern ว่า “เมนูไหน” ขึ้น-ลงวันไหน เพื่อตัดสินใจเตรียมวัตถุดิบ (ของแช่/ละลาย) ให้พอดี
        </p>
      </Section>

      {/* ---------------- Bottom: Daily Total + Top Sellers ---------------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="ยอดขายตามช่วงเวลา"
          icon={<CalendarDays className="h-5 w-5" />}
          right={<span className="text-xs text-slate-400">{g==="day"?"รายวัน":g==="month"?"รายเดือน":"รายปี"}</span>}
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTotal}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopOpacity={0.35} stopColor="#fb923c" />
                    <stop offset="95%" stopOpacity={0} stopColor="#fb923c" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={64} />
                <Tooltip formatter={(v)=>[fmtTHB(v),"ยอดขาย"]} />
                <Area type="monotone" dataKey="amount" stroke="#fb923c" fill="url(#g1)" strokeWidth={2} dot={{ r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section
          title="เมนูขายดี (สัดส่วน %)"
          icon={<Flame className="h-5 w-5" />}
          right={<span className="text-xs text-slate-400">Top</span>}
        >
          <div className="h-[280px]">
            {topSellers?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellers}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0,100]} tick={{ fontSize: 12 }} width={36} />
                  <Tooltip formatter={(v)=>[`${Number(v)}%`, "สัดส่วนออเดอร์"]} />
                  <Bar dataKey="percent" radius={[8,8,0,0]} fill="#fb923c" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-slate-400">ยังไม่มีข้อมูล</div>
            )}
          </div>
        </Section>

        <Section
          title="สรุปเร็ว"
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• กราฟเส้นซ้าย: ดูแนวโน้มแยกตามเมนู (จำนวนจาน/ยอดขาย, ปรับเป็นแบบสะสมได้)</li>
            <li>• การ์ด “จำนวนจาน” = ปริมาณงานครัวจริงในช่วงที่เลือก</li>
            <li>• ใช้ “เมนูขายดี” ช่วยปรับเมนู/โปรโมชันรายวัน</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
