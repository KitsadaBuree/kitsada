// ...existing code...
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductClient from "../../../../components/ProductClient";


export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    (async () => {
      // รีเซ็ตสถานะก่อน fetch
      setProduct(null);
      setErr("");

      try {
        const res = await fetch(`/api/productAPI/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const text = await res.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON response */ }

        if (!res.ok) {
          const message = json?.error || res.statusText || `HTTP ${res.status}`;
          throw new Error(message);
        }

        const data = json?.data ?? json;
        if (!data) throw new Error("ไม่มีข้อมูลสินค้า");
        setProduct(data);
      } catch (e) {
        if (e.name === "AbortError") return; // ยกเลิกการเรียก ไม่ต้อง set error
        setErr(e.message || "เกิดข้อผิดพลาด");
      }
    })();

    return () => controller.abort();
  }, [id]);

  if (err) return <div className="p-6">ไม่พบสินค้า ID {id} — {err}</div>;
  if (!product) return <div className="p-6">กำลังโหลด...</div>;
  return <ProductClient product={product} onCloseHref="/" />;
}
// ...existing code...