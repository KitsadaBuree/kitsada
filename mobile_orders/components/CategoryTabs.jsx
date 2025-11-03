"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export default function CategoryTabs({
  categories = [],
  activeIndex = 0,
  onChange = () => {},
  searchTerm = "",
  onSearch = () => {},
}) {
  const containerRef = useRef(null);
  const tabRefs = useRef([]);
  const inputRef = useRef(null);

  const [underlineStyle, setUnderlineStyle] = useState({
    width: 0,
    transform: "translateX(0px)",
  });
  const [focused, setFocused] = useState(false);
  const isOpen = focused || (searchTerm ?? "").length > 0;

  useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (el) {
      setUnderlineStyle({
        width: el.offsetWidth,
        transform: `translateX(${el.offsetLeft}px)`,
      });
    }
  }, [activeIndex, categories]);

  return (
    <div
      className="sticky top-14 z-40 bg-white border-b"
      style={{ borderColor: "#E9E9EB" }}
    >
      <div className="relative flex items-center gap-3 px-3 h-14">
        {/* ปุ่มเรียกค้นหา (แสดงเฉพาะตอนปิดค้นหา) */}
        {!isOpen && (
          <button
            aria-label="ค้นหา"
            className="p-2"
            onClick={() => {
              setFocused(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            {/* ขนาด 24px */}
            <Search className="w-6 h-6" style={{ color: "#F4935E" }} />
          </button>
        )}

        {/* พื้นที่แท็บ + เส้นใต้ */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-x-auto scrollbar-none h-full"
        >
          <div
            className={`flex items-center gap-6 min-w-max relative h-full transition-opacity ${
              isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {categories.map((label, i) => (
              <button
                key={label}
                ref={(el) => (tabRefs.current[i] = el)}
                onClick={() => onChange(i)}
                className={`pb-1 text-base whitespace-nowrap transition-colors ${
                  i === activeIndex ? "text-[#F4935E]" : "text-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!isOpen && (
            <span
              className="absolute bottom-0 h-[3px] rounded-full transition-all duration-200"
              style={{ ...underlineStyle, background: "#F4935E" }}
            />
          )}

          {/* แถบค้นหาแบบทับแท็บ */}
          <div
            className={`absolute inset-0 flex items-center transition-opacity ${
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="relative w-full">
              {/* ขนาด 24px */}
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6"
                style={{ color: "#F4935E" }}
                aria-hidden
              />
              <input
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="พิมพ์เพื่อค้นหา…"
                className="w-full pl-12 pr-12 py-3 rounded-2xl border outline-none bg-white text-[16px]"
                style={{ borderColor: "#E9E9EB" }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onSearch("");
                    setFocused(false);
                  }
                }}
                onBlur={() => {
                  if (!searchTerm) setFocused(false);
                }}
              />
              {!!searchTerm && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSearch("");
                    setFocused(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100"
                  aria-label="ล้างคำค้น"
                >
                  {/* ขนาด 24px */}
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
