// components/MenuClient.jsx
"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CategoryTabs from "./CategoryTabs";
import { ItemCard } from "./ItemCard";
import { addToCart } from "../lib/card";

export default function MenuClient({ items = [] }) {
  const router = useRouter();

  const categories = useMemo(() => {
    const set = new Set(
      items.map(it => (it.category ?? it.category_name ?? "").trim()).filter(Boolean)
    );
    return ["ทั้งหมด", ...Array.from(set)];
  }, [items]);

  const [active, setActive] = useState(0);
  const [search, setSearch] = useState("");
  const activeCat = categories[active];

  useEffect(() => { if (active >= categories.length) setActive(0); }, [categories, active]);

  const byCategory = useMemo(() => {
    if (active === 0 || activeCat === "ทั้งหมด") return items;
    return items.filter(it => (it.category ?? it.category_name ?? "").trim() === activeCat);
  }, [items, active, activeCat]);

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(it => {
      const name = String(it.name ?? "").toLowerCase();
      const desc = String(it.description ?? "").toLowerCase();
      const idStr = String(it.id ?? "");
      return name.includes(q) || desc.includes(q) || idStr.includes(q);
    });
  }, [byCategory, search]);

  // ✅ ฟังก์ชันเพิ่มลงตะกร้าและไปหน้า /card
  function handleAdd(item) {
    addToCart(item, 1, "");
    router.push("/card");     // ถ้าต้องการอยู่หน้าเดิม ให้เอาบรรทัดนี้ออกหรือแสดง toast แทน
  }

  return (
    <div className="bg-white">
      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur border-b" style={{ borderColor: "#E9E9EB" }}>
        <div className="max-w-screen-sm mx-auto">
          <CategoryTabs
            categories={categories}
            activeIndex={active}
            onChange={setActive}
            searchTerm={search}
            onSearch={setSearch}
          />
        </div>
      </div>

      <div className="max-w-screen-sm mx-auto">
        <div className="h-1" aria-hidden />
        <ul className="mx-4 rounded-2xl">
          {filtered.map((it, idx) => (
            <li key={it.id ?? `${it.name}-${idx}`} className="py-3">
              <div className="rounded-xl transition-colors hover:bg-slate-50 active:scale-[0.999]">
                {/* ส่ง onAdd ให้ ItemCard */}
                <ItemCard {...it} onAdd={() => handleAdd(it)} />
              </div>
              {idx !== filtered.length - 1 && <div className="h-px mt-2" style={{ background: "#E9E9EB" }} />}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="text-center text-slate-400 py-10" aria-live="polite">
              ไม่พบสินค้าที่ตรงกับการค้นหา
            </li>
          )}
        </ul>
        <div className="h-6" aria-hidden />
      </div>
    </div>
  );
}
