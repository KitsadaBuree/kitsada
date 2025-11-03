// src/components/kitchen/KitchenSidebar.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import SidebarItem from "../sidebars/SidebarItem";
import SidebarLogout from "../sidebars/SidebarLogout";
import ConfirmLogoutDialog from "../sidebars/ConfirmLogoutDialog";
import SidebarUser from "../sidebars/SidebarUser";
import { UtensilsCrossed, Store } from "lucide-react";

export default function KitchenSidebar() {
  const router = useRouter();
  const pathname = usePathname();
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
        <div className="text-lg font-semibold text-white">KITCHEN</div>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-1">
        {/* ไม่ต้องส่ง active เพราะ SidebarItem คำนวณเอง */}
        <SidebarItem href="/kitchen/orders" icon={UtensilsCrossed} label="ออเดอร์" />
      </nav>

      {/* Footer */}
      <div className="mt-auto px-2">
        <SidebarLogout onClick={() => setConfirmOpen(true)} />

        {/* อวาตาร์ (กดได้ทั้งแถว → ไปหน้าโปรไฟล์) */}
        <SidebarUser
          name="กฤษฎา"
          role="Administrator"
          href="/kitchen/profile"
          active={pathname === "/kitchen/profile" || pathname.startsWith("/kitchen/profile/")}
        />

        <ConfirmLogoutDialog
          open={confirmOpen}
          loading={loading}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doLogout}
        />
      </div>
    </aside>
  );
}
