import { AlertTriangle } from "lucide-react";

export default function ConfirmDelete({ id, onCancel, onOK }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="
        fixed inset-0 z-50 grid place-items-center p-4
        bg-black/60                      /* fallback ทึบหน่อยหากไม่มี backdrop-filter */
        supports-[backdrop-filter]:bg-black/30
        backdrop-blur-sm backdrop-saturate-150
        transition
      "
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
        <div className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
          ลบรายการอาหาร
        </div>
        <p className="text-sm text-slate-600">คุณต้องการลบรายการ ID {id} ใช่ไหม?</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onOK}
            className="rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
}
