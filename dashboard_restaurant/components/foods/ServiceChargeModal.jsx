// components/foods/ServiceChargeModal.jsx
"use client";
import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";

export default function ServiceChargeModal({
  open,
  defaultRate = 0,
  onClose,
  onSave,
}) {
  const [rate, setRate] = useState(0);

  useEffect(() => {
    if (open) {
      setRate(clamp(defaultRate));
    }
  }, [open, defaultRate]);

  function clamp(v) {
    if (Number.isNaN(Number(v))) return 0;
    return Math.min(100, Math.max(0, Number(v)));
  }

  function onChangeNumber(e) {
    setRate(clamp(e.target.value));
  }

  function onChangeRange(e) {
    setRate(clamp(e.target.value));
  }

  async function handleSave() {
    const v = clamp(rate);
    await onSave?.(v);
  }

  if (!open) return null;

  return (
    // 👇 เบลอฉากหลัง + มืดเล็กน้อย
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 backdrop-blur-sm md:backdrop-blur">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-xl font-semibold">ตั้งค่า Service Charge</h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
          <label className="block space-y-2">
            <span className="text-slate-600">อัตรา (%)</span>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}          // 👈 จำกัดค่า 0–100 ตอนพิมพ์
                step={0.5}
                value={rate}
                onChange={onChangeNumber}
                className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-lg outline-none focus:ring-2 focus:ring-orange-300/40"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
            </div>
          </label>

          {/* Slider 0–100% */}
          <input
            type="range"
            min={0}
            max={100}              // 👈 จำกัดสไลเดอร์ 0–100
            step={0.5}
            value={rate}
            onChange={onChangeRange}
            className="range w-full accent-orange-500"
          />

          <p className="text-sm text-slate-500">
            เคล็ดลับ: ใช้ปุ่มลูกศร ↑/↓ เพื่อปรับทีละ 0.5%
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-white hover:bg-orange-600"
          >
            <Check size={18} /> บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
