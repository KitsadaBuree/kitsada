"use client";
import { AlertTriangle, X } from "lucide-react";

export default function ReviewModal({ open, items, serviceRate, onClose, onConfirm, busy, error }) {
  if (!open) return null;

  const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);
  const service = subtotal * serviceRate;
  const total = subtotal + service;
  const fmt = (n) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n || 0);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-semibold">ตรวจสอบรายการก่อนสั่ง</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto p-5">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">เมนู</th>
                <th className="w-24 px-3 py-2 text-center">จำนวน</th>
                <th className="w-28 px-3 py-2 text-right">ราคา/หน่วย</th>
                <th className="w-28 px-3 py-2 text-right">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it) => (
                <tr key={`review-${it.id}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{it.name}</div>
                    {it.note ? <div className="text-xs text-slate-500">หมายเหตุ: {it.note}</div> : null}
                  </td>
                  <td className="px-3 py-2 text-center">{it.qty}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {Number(it.price).toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {(Number(it.price) * Number(it.qty)).toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-800 ring-1 ring-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5" />
              <p className="text-sm">
                <strong>ข้อกำหนด:</strong> เมื่อกด “สั่งอาหาร” แล้ว <u>จะไม่สามารถยกเลิกได้</u> (ข้อ 11.1)
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">ยอดก่อนคิดค่าบริการ</span>
              <span className="tabular-nums">{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">ค่าบริการ ({Math.round(serviceRate * 100)}%)</span>
              <span className="tabular-nums">{fmt(service)}</span>
            </div>
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">ยอดรวม</span>
              <span className="tabular-nums font-semibold text-orange-600">{fmt(total)}</span>
            </div>
          </div>

          {error ? (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2">ยกเลิก</button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {busy ? "กำลังสั่ง..." : "สั่งอาหาร"}
          </button>
        </div>
      </div>
    </div>
  );
}
