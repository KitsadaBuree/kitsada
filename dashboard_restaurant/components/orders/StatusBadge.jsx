// components/orders/StatusBadge.jsx
"use client";
import { CheckCircle2, Clock4, XCircle } from "lucide-react";

export default function StatusBadge({ status }) {
  // ทำให้แน่ใจว่า status เป็นตัวพิมพ์เล็กและไม่มีช่องว่างเกิน
  const key = String(status || "").trim().toLowerCase();

  // รองรับค่าที่มาจากหลายแหล่ง (alias)
  const normalized =
    key === "doing" ? "cooking" : // alias เดิม
    key === "canceled" ? "cancelled" : // กันสะกดสองแบบ
    key;

  const map = {
    pending:   { text: "กำลังดำเนินการ", cls: "bg-amber-50 text-amber-700 ring-amber-200", Icon: Clock4 },
    cooking:   { text: "กำลังทำ",       cls: "bg-amber-50 text-amber-700 ring-amber-200", Icon: Clock4 },
    ready:     { text: "พร้อมเสิร์ฟ",    cls: "bg-sky-50 text-sky-700 ring-sky-200",       Icon: CheckCircle2 },
    served:    { text: "เสร็จแล้ว",      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: CheckCircle2 },
    cancelled: { text: "ยกเลิก",        cls: "bg-rose-50 text-rose-700 ring-rose-200",    Icon: XCircle },
  };

  const s = map[normalized] ?? map.pending;
  const Icon = s.Icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ${s.cls}`}>
      <Icon size={14} />
      {s.text}
    </span>
  );
}
