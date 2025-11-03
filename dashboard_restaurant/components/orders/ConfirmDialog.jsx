"use client";
import { useEffect } from "react";

export default function ConfirmDialog({
  open,
  title = "ยืนยันการทำรายการ",
  message = "",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  onConfirm,
  onClose,
  busy = false,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center">
      {/* Backdrop: เบลอ + มืดนิด ๆ (รองรับเฉพาะเบราว์เซอร์ที่มี backdrop-filter) */}
      <div
        className={[
          "absolute inset-0 animate-[fade_.15s_ease]",
          // สีพื้นหลังหลัก
          "bg-black/40",
          // ถ้ารองรับ backdrop-filter ให้ลดความมืดลงหน่อยและเพิ่มเบลอ
          "supports-[backdrop-filter]:bg-black/25",
          "supports-[backdrop-filter]:backdrop-blur-lg",      // <- ระดับเบลอหลัก
          "supports-[backdrop-filter]:backdrop-saturate-150", // ทำสีหลังโมดัลดูนุ่มขึ้น
        ].join(" ")}
      />

      {/* Dialog */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 animate-[pop_.15s_ease]">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {message && <p className="mt-1 text-slate-600">{message}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-xl px-4 py-2 text-sm text-white ${busy ? "bg-rose-400 cursor-wait" : "bg-rose-500 hover:bg-rose-600"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pop  { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
