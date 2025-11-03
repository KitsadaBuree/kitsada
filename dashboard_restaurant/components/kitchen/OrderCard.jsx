// src/components/kitchen/OrderCard.jsx
"use client";
import OrderStatusChip from "./OrderStatusChip";

export default function OrderCard({ order, onSetStatus }) {
  const { id, tableNo, timeText, items, note, status } = order;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">โต๊ะ</div>
          <div className="text-xl font-bold text-slate-800">#{tableNo}</div>
        </div>
        <div className="text-right">
          <OrderStatusChip status={status} />
          <div className="mt-1 text-xs text-slate-500">{timeText}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <div className="font-medium text-slate-800">{it.name}</div>
            <div className="text-slate-600">x{it.qty}</div>
          </div>
        ))}
      </div>

      {note && <div className="mt-3 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">หมายเหตุ: {note}</div>}

      <div className="mt-4 flex gap-2">
        {status !== "COOKING" && (
          <button
            onClick={() => onSetStatus(id, "COOKING")}
            className="rounded-xl bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700"
          >
            ตั้งเป็น “กำลังทำ”
          </button>
        )}
        {status !== "READY" && (
          <button
            onClick={() => onSetStatus(id, "READY")}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-100"
          >
            ตั้งเป็น “พร้อมเสิร์ฟ”
          </button>
        )}
      </div>
    </div>
  );
}
