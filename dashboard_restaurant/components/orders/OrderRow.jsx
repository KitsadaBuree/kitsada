"use client";
import StatusBadge from "./StatusBadge";
import { Trash2 } from "lucide-react";

export default function OrderRow({ item, onRemove }) {
  // Fallback รูปแบบ data URL (ไม่ต้องมีไฟล์ใน public)
  const FALLBACK =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#94a3b8">No Image</text></svg>'
    );

  return (
    <tr className="text-slate-700">
      {/* รหัสอาหาร */}
      <td className="px-4 py-3 font-mono text-slate-500">
        {String(item.id).padStart(6, "0")}
      </td>

      {/* ชื่อเมนู */}
      <td className="px-4 py-3">{item.name}</td>

      {/* รูปภาพ */}
      <td className="px-4 py-3">
        <div className="h-12 w-12 overflow-hidden rounded-xl ring-1 ring-slate-200">
          <img
            src={item.image_url ?? item.imageUrl ?? FALLBACK}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK;
            }}
          />
        </div>
      </td>

      {/* ราคา */}
      <td className="px-4 py-3 text-right tabular-nums">
        {Number(item.price).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        ฿
      </td>

      {/* สถานะ (ปรับได้ในคอมโพเนนต์ StatusBadge) */}
      <td className="px-4 py-3 text-center">
        <StatusBadge status={item.status} />
      </td>

      {/* หมายเหตุ — อ่านอย่างเดียว */}
      <td className="px-4 py-3">
        <input
          value={item.note || ""}
          readOnly
          disabled
          aria-label="หมายเหตุ (แก้ไขไม่ได้)"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
        />
      </td>

      {/* จำนวน — แสดงอย่างเดียว ไม่มี + / − */}
      <td className="px-4 py-3">
        <div className="mx-auto w-16 text-center tabular-nums">{item.qty}</div>
      </td>

      {/* ลบ */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onRemove?.(item.id)}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-rose-700 hover:bg-rose-100"
          title="ลบรายการนี้"
        >
          <Trash2 size={14} />
          ลบ
        </button>
      </td>
    </tr>
  );
}
