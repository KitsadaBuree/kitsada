// components/Navbar.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList } from "lucide-react";
import useAuth from "@/app/api/hooks/useAuth";

const POLL_MS = 6000;

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [tableName, setTableName] = useState("");
  const [orderCount, setOrderCount] = useState(0);   // จำนวนรายการในออเดอร์ล่าสุดที่ยังไม่จ่าย
  const [ordersHref, setOrdersHref] = useState("/"); // ลิงก์ปุ่มออเดอร์ → /orders/[code] หรือ "/"

  const firstName = user?.name
    ? (user.name.trim().split(/\s+/)[0] || user.name.trim())
    : null;

  // อ่านข้อมูลโต๊ะจาก path/localStorage และดึงรายละเอียดโต๊ะ (ครั้งเดียว/เมื่อ path เปลี่ยน)
  useEffect(() => {
    const m = /^\/t\/([^/?#]+)/.exec(pathname || "");
    const codeInPath = m?.[1] || null;

    let cachedCode = "";
    let cachedName = "";
    try {
      cachedCode = localStorage.getItem("table_code") || "";
      cachedName = localStorage.getItem("table_name") || "";
    } catch {}

    if (codeInPath && codeInPath !== cachedCode) {
      try { localStorage.setItem("table_code", codeInPath); } catch {}
      cachedCode = codeInPath;
    }
    setTableName(cachedName || "");

    if (cachedCode && (!cachedName || codeInPath)) {
      (async () => {
        try {
          const r = await fetch(`/api/table?code=${encodeURIComponent(cachedCode)}`, { cache: "no-store" });
          const j = await r.json().catch(() => ({}));
          if (r.ok && j?.ok && j.data) {
            const t = j.data; // { id, number, name }
            const newName = t.name ?? (t.number != null ? String(t.number) : "");
            if (t.id)             try { localStorage.setItem("table_id", String(t.id)); } catch {}
            if (t.number != null) try { localStorage.setItem("table_no", String(t.number)); } catch {}
            if (newName) {
              try { localStorage.setItem("table_name", newName); } catch {}
              setTableName(newName);
            }
          }
        } catch {}
      })();
    }
  }, [pathname]);

  // โพลล์หาออเดอร์ที่ยังไม่จ่ายล่าสุดของโต๊ะ เพื่อทำ badge + ตั้ง href ไป /orders/[code]
  useEffect(() => {
    let alive = true;
    let timer;

    async function loadLatestUnpaid() {
      try {
        const table = localStorage.getItem("table_name") || "";
        if (!table) {
          if (alive) { setOrderCount(0); setOrdersHref("/"); }
          return;
        }
        const r = await fetch(
          `/api/orders/by-table?table_no=${encodeURIComponent(table)}&limit=1`, 
          { cache: "no-store" }
        );
        const j = await r.json().catch(() => ({}));

        if (!alive) return;

        if (r.ok && j?.ok && Array.isArray(j.data) && j.data.length) {
          const o = j.data[0]; // ล่าสุด
          const paid = (o.payment_status || "UNPAID").toUpperCase() === "PAID";
          const closed = Boolean(o.closed_at);
          if (!paid && !closed && o.order_code) {
            setOrdersHref(`/orders/${encodeURIComponent(o.order_code)}`);
            setOrderCount(Number(o.items_count || 0));
            return;
          }
        }
        // ถ้าไม่มีออเดอร์ที่ยังไม่จ่าย
        setOrdersHref("/");
        setOrderCount(0);
      } catch {
        if (alive) { setOrdersHref("/"); setOrderCount(0); }
      }
    }

    loadLatestUnpaid();
    timer = setInterval(loadLatestUnpaid, POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b"
      style={{ borderColor: "#E9E9EB", paddingTop: "env(safe-area-inset-top)" }}
      role="navigation"
      aria-label="หลัก"
    >
      <div className="h-14 max-w-screen-sm mx-auto px-3 sm:px-4 flex items-center justify-between">
        {/* ป้ายเลขโต๊ะ */}
        <span
          className="inline-flex items-center rounded-2xl border px-3 py-1.5 text-[14px] font-medium
                     text-slate-700 bg-white select-none"
          style={{ borderColor: "#CBD5E1" }}
          title="เลขโต๊ะ"
        >
          {tableName ? `โต๊ะ ${tableName}` : "ไม่ระบุโต๊ะ"}
        </span>

        {/* ขวา: ผู้ใช้ + ปุ่มออเดอร์ (มี badge) */}
        <div className="flex items-center gap-3">
          {firstName ? (
            <Link
              href={`/about-me?next=${encodeURIComponent(pathname || "/")}`}
              className="text-[#F4935E] font-extrabold text-xl leading-none"
              aria-label="ไปยังโปรไฟล์"
            >
              {firstName}
            </Link>
          ) : (
            <Link
              href="/profile"
              className="text-slate-600 hover:text-slate-800 font-medium"
              aria-label="เข้าสู่ระบบ"
            >
              เข้าสู่ระบบ
            </Link>
          )}

          <Link
            href={ordersHref}
            aria-label="ออเดอร์ของโต๊ะนี้"
            className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            title="ออเดอร์"
          >
            <ClipboardList className="w-6 h-6" />
            {orderCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full
                           grid place-items-center text-white text-[11px] font-semibold shadow-md"
                style={{ background: "#EF4444" }}
                aria-label={`มี ${orderCount} เมนูที่สั่ง`}
              >
                {orderCount > 99 ? "99+" : orderCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
