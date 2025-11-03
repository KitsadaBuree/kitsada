"use client";
import { useEffect, useState } from "react";

export default function TablePicker({ open, initialName = "", onClose }) {
  const [name, setName] = useState(initialName || "");

  useEffect(() => setName(initialName || ""), [initialName]);

  if (!open) return null;

  const save = () => {
    const n = name.trim();
    if (!n) return;
    try {
      localStorage.setItem("table_name", n);
      // ถ้ามีระบบโค้ดโต๊ะภายหลัง ค่อย set table_code ด้วย
    } catch {}
    onClose?.(n);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 grid place-items-center">
      <div className="w-[92%] max-w-sm rounded-2xl bg-white p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800">ตั้งค่าเลขโต๊ะ</h3>
        <p className="text-sm text-slate-500 mt-1">พิมพ์เช่น “โต๊ะ 1”, “A2”, หรือ “Takeaway”</p>
        <input
          className="mt-3 w-full rounded-xl border px-3 py-2 bg-gray-50"
          placeholder="เช่น โต๊ะ 1"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="mt-3 flex gap-2">
          <button onClick={()=>onClose?.(null)} className="flex-1 rounded-xl border px-3 py-2">ยกเลิก</button>
          <button onClick={save} className="flex-1 rounded-xl bg-orange-500 text-white px-3 py-2">บันทึก</button>
        </div>
      </div>
    </div>
  );
}
