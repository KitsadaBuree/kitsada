"use client";
import { AlertTriangle } from "lucide-react";

export default function ConfirmLogoutDialog({
  open = false,
  onCancel,
  onConfirm,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-md p-4" // ← เบลอพื้นหลัง
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      onClick={onCancel} // คลิกฉากหลัง = ยกเลิก
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()} // กันคลิกทะลุ
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-orange-100 p-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 id="logout-title" className="text-lg font-semibold">
              ออกจากระบบ?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบตอนนี้
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm text-orange-800 hover:bg-orange-50"
            onClick={onCancel}
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "กำลังออก..." : "ออกจากระบบ"}
          </button>
        </div>
      </div>
    </div>
  );
}
