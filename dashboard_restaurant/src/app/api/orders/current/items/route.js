// src/app/api/orders/current/items/route.js
import { ensureDraftOrder } from "../../_utils";
import { query } from "../../../../../../lib/db"; // หรือ "@/lib/db" ถ้าตั้ง alias
export const runtime = "nodejs";

export async function GET() {
  try {
    const order = await ensureDraftOrder();
    const rows = await query(
      `SELECT
         oi.id,
         oi.product_id,
         oi.qty,
         p.price AS price,                              -- ← แก้ตรงนี้
         oi.note,
         CASE WHEN oi.status = 'ready' THEN 'ready' ELSE 'doing' END AS status,
         p.name,
         p.imageUrl AS image_url
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [order.id]
    );
    return Response.json({ ok: true, order_id: order.id, items: rows, service_rate: order.service_rate });
  } catch (e) {
    console.error("GET /api/orders/current/items", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const order = await ensureDraftOrder();
    const b = await req.json();
    const product_id = Number(b.product_id);
    const qty = Math.max(1, Number(b.qty || 1));

    const [p] = await query(`SELECT price FROM products WHERE id = ?`, [product_id]);
    if (!p) return Response.json({ ok: false, error: "product not found" }, { status: 404 });

    const [exist] = await query(
      `SELECT id, qty FROM order_items WHERE order_id = ? AND product_id = ?`,
      [order.id, product_id]
    );
    if (exist) {
      await query(`UPDATE order_items SET qty = qty + ? WHERE id = ?`, [qty, exist.id]);
    } else {
      await query(
        `INSERT INTO order_items (order_id, product_id, qty, created_at)
         VALUES (?, ?, ?, NOW())`,
        [order.id, product_id, qty]
      );
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/orders/current/items", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
