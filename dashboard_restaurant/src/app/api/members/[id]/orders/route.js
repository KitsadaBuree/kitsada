import { query } from "../../../../../../lib/db";

// GET /api/members/:id/orders
export async function GET(_req, { params }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) {
    return Response.json({ ok: false, error: "bad id" }, { status: 400 });
  }

  const orders = await query(
    `
    SELECT id, order_code, total, payment_status, payment_method, created_at
    FROM orders
    WHERE customer_id = ?
    ORDER BY created_at DESC
    `,
    [id]
  );

  // ถ้าต้องการไลน์ไอเท็มของออเดอร์ล่าสุดด้วย
  // const items = await query(`SELECT * FROM order_items WHERE order_id = ?`, [orders[0]?.id]);

  return Response.json({ ok: true, data: orders });
}
