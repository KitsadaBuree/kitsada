"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarItem from "./SidebarItem";
import SidebarLogout from "./SidebarLogout";
import ConfirmLogoutDialog from "./ConfirmLogoutDialog";
import SidebarUser from "./SidebarUser";
import {
  LayoutDashboard, UtensilsCrossed, ReceiptText,
  CheckCircle2, Users2, Table2, Store, History   // ⬅️ เพิ่ม History
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setConfirmOpen(false);
    if (confirmOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  async function doLogout() {
    try {
      setLoading(true);
      await fetch("/api/logout", { method: "DELETE" });
      router.push("/login");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-dvh w-64 flex-col bg-slate-900 px-4 py-5">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 ring-1 ring-white/10">
          <Store size={18} className="text-white" />
        </div>
        <div className="text-lg font-semibold text-white">RESTAURANT</div>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-1">
        <SidebarItem href="/dashboard/reports" icon={LayoutDashboard} label="แดชบอร์ด" />
        <SidebarItem href="/dashboard/foods" icon={UtensilsCrossed} label="รายการอาหาร" />
        <SidebarItem href="/dashboard/orders" icon={ReceiptText} label="ออเดอร์" />
        <SidebarItem href="/dashboard/orders_done" icon={CheckCircle2} label="ออเดอร์ที่ทำเสร็จแล้ว" />
        <SidebarItem href="/dashboard/order_history" icon={History} label="ประวัติการสั่งซื้อ" /> {/* ⬅️ เมนูใหม่ */}
        <SidebarItem href="/dashboard/staff" icon={Users2} label="จัดการพนักงาน" />
        <SidebarItem href="/dashboard/tables" icon={Table2} label="โต๊ะอาหาร" />
      </nav>

      {/* Footer */}
      <div className="mt-auto px-2">
        <SidebarLogout onClick={() => setConfirmOpen(true)} />
        <SidebarUser href="/dashboard/profile" />
      </div>

      <ConfirmLogoutDialog
        open={confirmOpen}
        loading={loading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doLogout}
      />
    </aside>
  );
}
