"use client";
export default function ConfirmDialog({ open, title, desc, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-slate-600">{desc}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100">ยกเลิก</button>
          <button onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700">ยืนยันลบ</button>
        </div>
      </div>
    </div>
  );
}
