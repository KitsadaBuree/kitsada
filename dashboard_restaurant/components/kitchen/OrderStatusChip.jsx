// src/components/kitchen/OrderStatusChip.jsx
export default function OrderStatusChip({ status }) {
  const map = {
    NEW: "bg-slate-200 text-slate-700",
    COOKING: "bg-orange-100 text-orange-700",
    READY: "bg-emerald-100 text-emerald-700",
  };
  const text = status === "COOKING" ? "กำลังทำ" : status === "READY" ? "พร้อมเสิร์ฟ" : "ใหม่";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${map[status]}`}>{text}</span>;
}
