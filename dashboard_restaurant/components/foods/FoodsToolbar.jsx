// components/foods/FoodsToolbar.jsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, ChevronDown } from "lucide-react";

export default function FoodsToolbar({
  q, onChangeQ,
  catId, onChangeCatId,          // เก็บเป็น string: "", "1", "2", ...
  categories = [],
  onAdd,
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!btnRef.current || !popRef.current) return;
      if (!btnRef.current.contains(e.target) && !popRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  const uniqCategories = useMemo(() => {
    const map = new Map();
    for (const c of categories ?? []) {
      if (!c) continue;
      const id = c.id;
      if (id == null) continue;
      const k = String(id);
      if (!map.has(k)) map.set(k, { id, name: c.name ?? "", count: c.count ?? 0 });
    }
    return Array.from(map.values());
  }, [categories]);

  const label =
    catId === ""
      ? "ทั้งหมด"
      : (uniqCategories.find((c) => String(c.id) === String(catId))?.name || "ทั้งหมด");

  return (
    <div className="px-4 pt-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <input
            value={q}
            onChange={(e) => onChangeQ?.(e.target.value)}
            placeholder="ค้นหาเมนู ชื่อ/ประเภท…"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-4
                       focus-visible:ring-2 focus-visible:ring-orange-300/40 focus-visible:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
            <button
              ref={btnRef}
              type="button"
              onClick={() => setOpen(v => !v)}
              className="h-12 inline-flex items-center gap-2 rounded-[14px]
                         border border-slate-200 bg-white/90 px-4 pr-3 hover:bg-white
                         focus-visible:ring-2 focus-visible:ring-blue-200"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <Filter size={18} className="text-slate-600" />
              <span className="whitespace-nowrap text-slate-800">{label}</span>
              <ChevronDown size={16} className="ml-1 text-slate-400" />
            </button>

            {open && (
              <div
                ref={popRef}
                className="absolute right-0 top-[calc(100%+8px)] z-[60] w-64 overflow-hidden
                           rounded-lg border border-slate-200 bg-white shadow-xl"
                role="listbox"
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onChangeCatId?.(""); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left
                              ${catId === "" ? "bg-orange-50 text-orange-700" : "text-slate-800 hover:bg-slate-50"}`}
                >
                  <span className="truncate">ทั้งหมด</span>
                  <span className={`ml-2 text-[13px] ${catId === "" ? "text-orange-600" : "text-slate-400"}`}>✓</span>
                </button>

                <ul className="max-h-64 overflow-auto py-1">
                  {uniqCategories.length === 0 && (
                    <li className="px-3 py-2 text-slate-400 text-sm">ยังไม่มีหมวดหมู่</li>
                  )}
                  {uniqCategories.map((c) => {
                    const active = String(c.id) === String(catId);
                    return (
                      <li key={`cat-${c.id}`}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { onChangeCatId?.(String(c.id)); setOpen(false); }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left
                                      ${active ? "bg-orange-50 text-orange-700" : "text-slate-800 hover:bg-slate-50"}`}
                          role="option"
                          aria-selected={active}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="ml-3 min-w-[28px] text-right text-[13px] tabular-nums text-slate-400">
                            ({c.count ?? 0})
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="h-12 min-w-[160px] rounded-2xl bg-orange-500 px-5 text-white hover:bg-orange-600 md:ml-1"
          >
            + เพิ่มรายการ
          </button>
        </div>
      </div>
    </div>
  );
}
