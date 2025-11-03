"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function SidebarUser({ href = "/dashboard/profile", active }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/about", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json?.ok) setUser(json.user);
      } catch {}
      finally { mounted && setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const isActive = active ?? (pathname === href || (href !== "/" && pathname.startsWith(href + "/")));
  const displayName = user?.name || (loading ? "กำลังโหลด…" : "-");
  const displayRole = user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : (loading ? "…" : "-");
  const initial = (user?.name?.[0] || "").toUpperCase() || (loading ? "" : "?");

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={clsx(
        "group mt-4 block rounded-2xl px-3 py-3 text-sm transition-colors",
        "border focus:outline-none focus:ring-1 focus:ring-orange-400/40",
        isActive ? "bg-white/10 border-white/20 text-white"
                 : "border-transparent text-slate-300 hover:text-white hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-full bg-slate-800 text-white">
          {/* ให้ค่า avatar คงที่ตอน SSR เพื่อลด hydration mismatch */}
          <span suppressHydrationWarning>{initial}</span>
        </div>
        <div className="min-w-0 leading-tight">
          <div className={clsx("truncate font-medium", isActive ? "text-white" : "text-white/90")}>
            {displayName}
          </div>
          <div className={clsx("truncate text-xs", isActive ? "text-white/80" : "text-slate-400")}>
            {displayRole}
          </div>
        </div>
      </div>
    </Link>
  );
}
