"use client";
import { LogOut } from "lucide-react";

export default function SidebarLogout({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-auto flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
    >
      <LogOut className="h-4 w-4" />
      Log Out
    </button>
  );
}
