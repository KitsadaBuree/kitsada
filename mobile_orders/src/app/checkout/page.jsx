// src/app/checkout/page.jsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BillClient from "../../../components/BillClient";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const codeParam  = (searchParams.get("code")  || "").trim();
  const tableParam = (searchParams.get("table") || "").trim();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [tableNo, setTableNo] = useState("");
  const [serviceRate, setServiceRate] = useState(); // factor 0-1
  const [orderCode, setOrderCode] = useState("");

  // คำนวณรวม
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.unit_price || 0), 0),
    [items]
  );
  const serviceCharge = useMemo(
    () => Number(((subtotal || 0) * Number(serviceRate || 0)).toFixed(2)),
    [subtotal, serviceRate]
  );
  const total = useMemo(
    () => Number(((subtotal || 0) + serviceCharge).toFixed(2)),
    [subtotal, serviceCharge]
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) เลือกแหล่งอ้างอิงออเดอร์: ให้ codeParam ชนะ
        const codeFromStore =
          (typeof window !== "undefined" ? localStorage.getItem("last_order_code") : "") || "";
        const code = codeParam || codeFromStore;

        // 2) เลือกโต๊ะ: ให้ tableParam ชนะ
        const tableFromStore =
          (typeof window !== "undefined" ? localStorage.getItem("table_name") : "") || "";
        const tableKey = tableParam || tableFromStore;

        let data;

        if (code) {
          // โหลดจากรหัสออเดอร์
          const r = await fetch(`/api/orders/${encodeURIComponent(code)}`, { cache: "no-store" });
          const j = await r.json().catch(() => null);
          if (!r.ok || !j?.ok) throw new Error((j && j.error) || `HTTP ${r.status}`);
          data = j.data;
        } else {
          // ไม่มี code → ดึงใบล่าสุดของโต๊ะที่กำหนด (ให้ tableParam ชนะ)
          if (!tableKey) throw new Error("ยังไม่พบโต๊ะสำหรับออกบิล");
          let r = await fetch(`/api/orders/latest?table_no=${encodeURIComponent(tableKey)}`, { cache: "no-store" });
          let j = await r.json().catch(() => null);
          if (!r.ok || !j?.ok) {
            r = await fetch(`/api/orders/latest?table=${encodeURIComponent(tableKey)}`, { cache: "no-store" });
            j = await r.json().catch(() => null);
            if (!r.ok || !j?.ok) throw new Error((j && j.error) || `HTTP ${r.status}`);
          }
          data = j.data;
        }

        if (!alive) return;

        const nextItems = (data?.items || []).map(it => ({
          name: String(it.name || ""),
          qty: Number(it.qty || 0),
          unit_price: Number(it.unit_price || 0),
        }));

        // ให้ tableParam ทับค่าจาก DB/Store เสมอ
        const tableFromData =
          String(data?.order?.table_no ?? data?.order?.table ?? "") || "";
        const nextTable = tableParam || tableFromData || tableFromStore || "";

        // อัตราค่าบริการ: ใช้ของบิล ถ้าไม่มี fallback 2.5%
        const rawRate = Number(data?.order?.service_rate);
        const rate = Number.isFinite(rawRate)
          ? (rawRate > 1 ? rawRate / 100 : rawRate)
          : 0.025; // fallback 2.5%

        const codeStr = String(data?.order?.order_code || code || "");

        setItems(nextItems);
        setTableNo(nextTable);
        setServiceRate(rate);
        setOrderCode(codeStr);

        // 3) เก็บ snapshot ให้สอดคล้องกับ URL (เขียนทับด้วย tableParam ถ้ามี)
        try {
          const sub = nextItems.reduce((s, it) => s + it.qty * it.unit_price, 0);
          const chg = Number((sub * rate).toFixed(2));
          const tot = Number((sub + chg).toFixed(2));
          sessionStorage.setItem(
            "bill:current",
            JSON.stringify({
              orderCode: codeStr,
              tableNo: nextTable,
              serviceRate: rate,
              items: nextItems,
              subtotal: sub,
              serviceCharge: chg,
              grandTotal: tot,
              earnedPoints: Math.floor(tot / 10),
            })
          );
        } catch {}
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [codeParam, tableParam]); // เปลี่ยนเมื่อพารามิเตอร์ URL เปลี่ยน

  // ยืนยันเช็คบิล
  const handleRequestBill = useCallback(async () => {
    try {
      if (!orderCode) throw new Error("ไม่พบรหัสใบเสร็จ");
      const r = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/request-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error((j && j.error) || `HTTP ${r.status}`);
      router.push(`/receipt/${encodeURIComponent(orderCode)}`);
    } catch (e) {
      alert(e.message || "ยืนยันไม่สำเร็จ");
    }
  }, [orderCode, router]);

  if (loading) return <div className="p-6 text-slate-500 text-center">กำลังโหลด...</div>;
  if (err)     return <div className="p-6 text-rose-600">{err}</div>;

  return (
    <BillClient
      items={items}
      tableNo={tableNo}
      orderCode={orderCode}
      serviceRate={serviceRate}
      subtotal={subtotal}
      serviceCharge={serviceCharge}
      total={total}
      onCloseHref="/orders"
      onConfirm={handleRequestBill}
    />
  );
}
