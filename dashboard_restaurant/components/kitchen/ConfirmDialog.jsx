// src/components/ConfirmDialog.jsx
"use client";

export default function ConfirmDialog({
  open,
  title = "ยืนยันการทำรายการ",
  message = "ต้องการดำเนินการต่อหรือไม่?",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="px-5 pt-5">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="mt-1.5 text-slate-600">{message}</p>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t px-5 py-3">
            <button
              onClick={onCancel}
              className="rounded-lg border px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white shadow hover:bg-emerald-600 active:translate-y-[0.5px]"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
