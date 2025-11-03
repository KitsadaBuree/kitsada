"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Minus, Plus } from "lucide-react";

const KEY = "cart_v1";

// --- utils (อยู่นอก component ป้องกัน re-create ทุก render) ---
function safeReadCart() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function safeWriteCart(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {}
}

export default function ProductClient({ product, onCloseHref = "/" }) {
  const router = useRouter();

  const price = Number(product?.price ?? 0);
  const imageSrc = String(product?.imageUrl ?? "");

  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const total = useMemo(() => price * qty, [price, qty]);

  const dec = () => setQty(q => Math.max(1, q - 1));
  const inc = () => setQty(q => Math.min(99, q + 1));

  const handleAdd = () => {
    const cart = safeReadCart();
    const id = Number(product.id);
    const noteStr = String(note || "").trim();

    const idx = cart.findIndex(
      x => Number(x.id) === id && String(x.note || "") === noteStr
    );

    if (idx >= 0) {
      cart[idx].qty = Math.min(99, Number(cart[idx].qty || 0) + Number(qty || 1));
    } else {
      cart.push({
        id,
        name: String(product.name || ""),
        price,
        imageUrl: imageSrc,
        qty: Math.max(1, Number(qty || 1)),
        note: noteStr,
      });
    }

    safeWriteCart(cart);

    // หน่วง 1 tick กันกรณี transition เร็วเกินจนหน้า /card อ่านก่อน setItem เสร็จ
    setTimeout(() => router.push("/card"), 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
        <div className="h-14 max-w-screen-sm mx-auto flex items-center justify-between px-3">
          <a href={onCloseHref} className="p-2 rounded-xl hover:bg-slate-100" aria-label="ปิด">
            <X className="w-6 h-6 text-slate-800" />
          </a>
          <h1 className="text-base font-semibold text-slate-800 truncate">
            {product?.name || "สินค้า"}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-slate-200 aspect-[16/9] overflow-hidden">
        <img
          src={imageSrc || "/placeholder.png"}
          alt={product?.name ?? "สินค้า"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }}
        />
      </section>

      {/* Content */}
      <main className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
        <div className="px-5 pt-6 pb-8 space-y-3">
          <p className="text-slate-400 text-sm">ID {product?.id}</p>
          <h2 className="text-2xl font-bold text-slate-900">{product?.name}</h2>
          <p className="text-[28px] font-extrabold text-[#F4935E]">฿{price.toFixed(2)}</p>

          <div className="pt-4">
            <label htmlFor="note" className="block text-slate-600 text-base font-medium mb-2">
              หมายเหตุเพิ่มเติม (ถ้ามี)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ไม่เผ็ด / แยกน้ำ / ไม่ใส่ผัก ฯลฯ"
              className="w-full bg-[#F6F7F9] rounded-2xl border border-slate-200 p-3 text-slate-700 placeholder-slate-400
                         focus:ring-2 focus:ring-[#F4935E] focus:outline-none transition"
              rows={3}
            />
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      <div className="sticky bottom-0 z-50 bg-white/90 backdrop-blur border-t">
        <div className="mx-auto max-w-screen-sm px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={dec} className="w-10 h-10 rounded-full border flex items-center justify-center text-slate-600 hover:bg-slate-100">
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-6 text-center text-lg font-semibold tabular-nums">{qty}</span>
              <button onClick={inc} className="w-10 h-10 rounded-full border flex items-center justify-center text-slate-600 hover:bg-slate-100">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              className="flex-1 ml-3 rounded-2xl py-3 text-[17px] font-semibold text-white shadow-[0_-6px_12px_rgba(0,0,0,0.08)]
                         hover:opacity-95 active:translate-y-[1px] transition"
              style={{ background: "#F4935E" }}
            >
              เพิ่มลงตะกร้า ฿{total.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
