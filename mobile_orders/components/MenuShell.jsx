// components/MenuShell.jsx
"use client";

import { useMemo } from "react";
import useSWR from "swr";
import Navbar from "./Navbar";
import MenuClient from "./MenuClient";
import CartBar from "./CartBar";

const fetcher = (url) =>
  fetch(url, { credentials: "include" }).then(async (r) => {
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const t = await r.text().catch(() => "");
      throw new Error(`API ${r.status}: ${t.slice(0, 120)}`);
    }
    const j = await r.json();
    return j?.data ?? j; // รองรับทั้ง {data:[...]} หรือ [...]
  });

export default function MenuShell() {
  const { data, error, isLoading, isValidating } = useSWR(
    "/api/productAPI",
    fetcher,
    {
      keepPreviousData: true,   // ✅ ค้างผลลัพธ์เดิมไว้ระหว่างดึงใหม่ (แก้ตอนกดย้อน)
      revalidateOnFocus: false, // ไม่ดึงใหม่เมื่อกลับมาโฟกัสหน้า
    }
  );

  const items = useMemo(() => data ?? [], [data]);

  if (!data && isLoading) {
    return <div className="p-4">กำลังโหลด...</div>;
  }
  if (error) {
    return (
      <div className="p-4 text-red-600">
        โหลดรายการไม่ได้: {error.message || "fetch failed"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <Navbar />
      {/* ส่งสถานะ isRefreshing ให้ลูก (ถ้าจะขึ้น indicator จิ๋ว) */}
      <MenuClient items={items} isRefreshing={isValidating} />
      <CartBar href="/orderCard" />
    </div>
  );
}
