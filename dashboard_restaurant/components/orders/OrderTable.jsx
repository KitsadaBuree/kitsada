"use client";
import OrderRow from "./OrderRow";

export default function OrderTable({ items, onChangeNote, onChangeQty, onRemove }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="w-28 px-4 py-3 text-left">รหัสอาหาร</th>
            <th className="px-4 py-3 text-left">ชื่อ</th>
            <th className="w-24 px-4 py-3 text-left">รูปภาพ</th>
            <th className="w-32 px-4 py-3 text-right">ราคา</th>
            <th className="w-40 px-4 py-3 text-center">สถานะ</th>
            <th className="w-[260px] px-4 py-3 text-left">รายละเอียดเพิ่มเติม</th>
            <th className="w-40 px-4 py-3 text-center">จำนวน</th>
            <th className="w-20 px-4 py-3 text-center">ลบ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((it) => (
            <OrderRow
              key={it.id}
              item={it}
              onChangeNote={onChangeNote}
              onChangeQty={onChangeQty}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
