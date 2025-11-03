"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function SidebarItem({ href, icon: Icon, label }) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/" && pathname.startsWith(href + "/"));
  
  return (
    <Link
      href={href}
      className={clsx(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
        "border border-transparent",
        isActive
          ? "bg-white/10 text-white border-white/20"
          : "text-slate-300 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={clsx("h-4 w-4", isActive ? "text-orange-400" : "text-slate-400 group-hover:text-orange-400")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
