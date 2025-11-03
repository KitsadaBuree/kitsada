// components/foods/FoodTable.jsx
"use client";
import { Pencil, Trash2 } from "lucide-react";

export default function FoodTable({ items = [], onEdit, onDelete }) {

  // EMPTY STATE (แสดงเฉพาะตอนว่าง)
  if (!items.length) {
    return (
      <div className="p-16 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <span className="text-2xl">🍽️</span>
        </div>
        <h3 className="mt-5 text-lg font-semibold text-slate-800">ยังไม่มีรายการ</h3>
        <p className="mt-1 text-sm text-slate-500">
          คลิก “เพิ่มรายการ” เพื่อสร้างเมนูแรกของคุณ
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pt-2 md:pt-3">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr className="text-sm">
            <th className="w-28 px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">ชื่อ</th>
            <th className="w-48 px-4 py-3 text-center">ประเภท</th>
            <th className="w-40 px-4 py-3 text-right">ราคา</th>
            <th className="w-44 px-4 py-3 text-center">การจัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((it) => (
            <tr key={it.id} className="text-slate-700">
              {/* ID (แสดงเป็นเลข 6 หลักนำหน้า 0) */}
              <td className="px-4 py-3 font-mono text-sm text-slate-500">
                {String(it.id).padStart(6, "0")}
              </td>

              {/* ชื่อ + รูป */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl ring-1 ring-slate-200">
                    <img
                      src={it.imageUrl || "/placeholder.png"}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                    />
                  </div>
                  <div className="truncate">{it.name}</div>
                </div>
              </td>

              {/* ประเภท */}
              <td className="px-4 py-3 text-center">
                {it.category ? (
                  <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-orange-500">
                    {it.category}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>

              {/* ราคา */}
              <td className="px-4 py-3 text-right tabular-nums">
                {Number(it.price).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ฿
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit?.(it)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={14} />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => onDelete?.(it.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 size={14} />
                    ลบ
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
