// components/CartBar.jsx
"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function CartBar({
  label = "ตะกร้าสินค้า",
  reserveSpace = true,
  size = "lg",
  showIcon = true,      // ← เปลี่ยน default เป็น true
  disabled = false,
  count,
  total,
}) {
  const rightMeta =
    typeof total === "number"
      ? new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(total)
      : (typeof count === "number" ? `${count} รายการ` : null);
  const hasMeta = rightMeta != null;

  const S = size === "lg"
    ? { h: "h-[60px]", radius: "rounded-[22px]", text: "text-[20px]" }
    : { h: "h-14",      radius: "rounded-2xl",   text: "text-[18px]" };

  return (
    <>
      {reserveSpace && (
        <div
          aria-hidden
          style={{ height: `calc(env(safe-area-inset-bottom) + ${size === "lg" ? 96 : 88}px)` }}
        />
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white border-t"
        style={{
          borderColor: "#E9E9EB",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
        }}
      >
        <div className="mx-auto max-w-screen-sm px-4 pt-3 pb-1">
          <Link
            href="/card"
            prefetch={false}
            aria-disabled={disabled}
            className={[
              "w-full",
              S.h,
              S.radius,
              "grid items-center text-white font-semibold",
              S.text,
              "shadow-[0_8px_24px_rgba(244,147,94,0.28)]",
              "active:translate-y-[0.5px] transition",
              disabled ? "pointer-events-none opacity-60" : "hover:opacity-95",
            ].join(" ")}
            style={{ background: "#F4935E" }}
          >
            {hasMeta ? (
              // มี meta → จัด 3 คอลัมน์
              <div className="grid grid-cols-[auto,1fr,auto] items-center px-4">
                <span className="flex items-center">
                  {showIcon && <ShoppingCart className="w-[22px] h-[22px]" aria-hidden="true" />}
                </span>
                <span className="text-center">{label}</span>
                <span className="[font-variant-numeric:tabular-nums] tracking-[0.01em]">
                  {rightMeta}
                </span>
              </div>
            ) : (
              // ไม่มี meta → จัดกึ่งกลางจริง พร้อมไอคอน
              <div className="flex items-center justify-center gap-2 px-4">
                {showIcon && <ShoppingCart className="w-[22px] h-[22px]" aria-hidden="true" />}
                <span>{label}</span>
              </div>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
