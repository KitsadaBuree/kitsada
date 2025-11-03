// src/app/cart/page.jsx
"use client";
import { useEffect, useState } from "react";
import CartClient from "../../../components/CartClient";

function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("cart_v1");
    const list = raw ? JSON.parse(raw) : [];
    return (Array.isArray(list) ? list : []).map(i => ({
      id: Number(i.id),
      name: String(i.name || ""),
      price: Number(i.price || 0),
      imageUrl: i.imageUrl || "",
      qty: Math.max(1, Number(i.qty || 1)),
      note: i.note || "",
    }));
  } catch { return []; }
}

export default function CartPage() {
  const [items, setItems] = useState(() => readCart());
  const [serviceRate, setServiceRate] = useState(0); // ★ อัตรา service (ทศนิยม เช่น 0.045)

  // รีเฟรชตะกร้าเมื่อเข้าหน้านี้
  useEffect(() => { setItems(readCart()); }, []);

  // โหลด service rate จาก API
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/settings", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (alive) setServiceRate(r.ok && j?.ok ? Number(j.rate || 0) : 0);
      } catch {
        if (alive) setServiceRate(0);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <CartClient
      initialItems={items}
      serviceRate={serviceRate}   // ★ ส่งเข้าไปให้คอมโพเนนต์คำนวณ/แสดงผล
      onCloseHref="/"
    />
  );
}
