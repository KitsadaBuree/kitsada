// src/app/profile/orders/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/api/hooks/useAuth";
import { ArrowLeft, Eye } from "lucide-react";

export default function OrdersHistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => { if (!loading && !user) router.replace("/profile"); }, [loading, user, router]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await fetch("/api/profile/orders?limit=100", { cache:"no-store" });
      const j = await r.json().catch(()=> ({}));
      if (alive && j?.ok) setRows(j.orders);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-dvh bg-white">
      <header className="h-14 flex items-center px-2">
        <button onClick={() => router.back()} className="p-3 rounded-xl hover:bg-slate-100">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="mx-auto text-xl font-bold">ประวัติการสั่งซื้อ</h1>
        <div className="w-12" />
      </header>

      <main className="max-w-screen-sm mx-auto px-4 pb-6">
        <div className="space-y-3">
          {rows.map((o, i) => (
            <div key={i} className="rounded-2xl border p-4 flex items-center justify-between" style={{ borderColor:"#E9E9EB" }}>
              <div>
                <p className="font-semibold text-slate-800">วันที่สั่งซื้อ</p>
                <p className="text-[#F4935E] font-bold text-lg">
                  {new Date(o.created_at).toLocaleDateString("th-TH", { day:"2-digit", month:"short", year:"numeric" })}
                </p>
              </div>
              <button
                className="px-3 py-1.5 rounded-xl bg-[#F4935E] text-white font-semibold flex items-center gap-1"
                onClick={() => router.push(`/orders/${encodeURIComponent(o.order_code)}`)}
              >
                <Eye className="w-4 h-4" /> ดู
              </button>
            </div>
          ))}
          {!rows.length && <p className="text-center text-slate-400 py-10">ยังไม่มีประวัติการสั่งซื้อ</p>}
        </div>
      </main>
    </div>
  );
}
