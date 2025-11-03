// app/(dashboard)/dashboard/reports/page.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import ReportHeader from "../../../../../components/reports/ReportHeader";
import PlatesKPI from "../../../../../components/reports/PlatesKPI";
import SalesKPI from "../../../../../components/reports/SalesKPI";
import OrdersKPI from "../../../../../components/reports/OrdersKPI";
import MenuMultiLine from "../../../../../components/reports/MenuMultiLine";
// import TopSellersBig from "../../../../../components/reports/TopSellersBig";
import TopSellersCombo from "../../../../../components/reports/TopSellersCombo";

async function safeJsonFetch(url) {
  const r = await fetch(url, { cache: "no-store" });
  const t = await r.text().catch(() => "");
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  return JSON.parse(t);
}
function isoToday() {
  const d = new Date();
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function shiftDate(baseIso, g, step) {
  const d = new Date(baseIso);
  if (g === "day") d.setDate(d.getDate() + step);
  if (g === "month") d.setMonth(d.getMonth() + step, 1);
  if (g === "year") d.setFullYear(d.getFullYear() + step, 1);
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    dd = String(d.getDate()).padStart(2, "0");
  return g === "day"
    ? `${y}-${m}-${dd}`
    : g === "month"
    ? `${y}-${m}-01`
    : `${y}-01-01`;
}

export default function ReportsPage() {
  // เริ่มต้นเป็น "รายวัน (วันนี้)"
  const [granularity, setGranularity] = useState("day");
  const [date, setDate] = useState(isoToday());
  const [data, setData] = useState(null);

  // formatter
  const fmtTHB = useMemo(
    () => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }),
    []
  );

  useEffect(() => {
    (async () => {
      const q = new URLSearchParams({ granularity, date }).toString();
      const res = await safeJsonFetch(`/api/reports/summary?${q}`);
      setData(res?.data || null);
    })();
  }, [granularity, date]);

  const menus = useMemo(() => data?.menus || [], [data]);
  const menuSalesByDate = useMemo(() => data?.menuSalesByDate || [], [data]);

  return (
    <div className="mx-auto w-full max-w-7xl p-6 space-y-6">
      <ReportHeader
        granularity={granularity}
        setGranularity={(g) => {
          if (g === "day") setDate(isoToday());
          if (g === "month") setDate(isoToday().slice(0, 7) + "-01");
          if (g === "year") setDate(isoToday().slice(0, 4) + "-01-01");
          setGranularity(g);
        }}
        date={date}
        setDate={setDate}
        onPrev={() => setDate(shiftDate(date, granularity, -1))}
        onNext={() => setDate(shiftDate(date, granularity, +1))}
      />

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* จำนวนจานทั้งหมด (ตามช่วงที่เลือก) */}
        <PlatesKPI platesCount={data?.platesCount ?? 0} />

        {/* ยอดขายรวม (บาท) */}
        <SalesKPI
          amount={data?.todaySales ?? 0}
          caption="รวมยอดสุทธิจากบิลที่ชำระแล้ว (ช่วงเวลาที่เลือก)"
        />

        {/* จำนวนบิล/ออเดอร์ */}
        <OrdersKPI
          count={data?.ordersCount ?? 0}
          caption="นับเฉพาะบิลที่ชำระแล้ว"
        />
      </div>

      {/* กราฟเส้น (ยอดสะสมตามเมนู) */}
      <MenuMultiLine data={menuSalesByDate} menus={menus} yLabel="จำนวนจาน" />

      {/* เมนูขายดี */}
      {/* <TopSellersBig items={data?.topSellers || []} showPercent /> */}

      {/* มุมมองโดนัท */}
      <TopSellersCombo items={data?.topSellers || []} showPercent />
    </div>
  );
}
