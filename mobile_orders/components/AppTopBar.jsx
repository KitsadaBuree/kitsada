"use client";
import useAuth from "@/hooks/useAuth";

export default function AppTopBar() {
  const { user, loading, logout } = useAuth();
  return (
    <header className="h-14 flex items-center justify-between px-4">
      {/* ซ้าย… (เช่น แสดงโต๊ะ) */}
      <div className="rounded-xl border px-3 py-1 text-slate-600">โต๊ะ {localStorage.getItem("table_name") || "-"}</div>

      {/* ขวา */}
      <div className="flex items-center gap-3">
        {!loading && user ? (
          <>
            <span className="text-[#F4935E] font-semibold">คุณ {user.name || "ผู้ใช้"}</span>
            <button
              onClick={logout}
              className="rounded-xl px-3 py-1 border text-slate-600 hover:bg-slate-50"
              title="ออกจากระบบ"
            >
              ออก
            </button>
          </>
        ) : (
          <a href="/profile" className="rounded-xl px-3 py-1 border text-slate-600 hover:bg-slate-50">เข้าสู่ระบบ</a>
        )}
      </div>
    </header>
  );
}
