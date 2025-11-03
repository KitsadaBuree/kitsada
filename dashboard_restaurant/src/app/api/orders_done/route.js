// src/app/api/orders_done/route.js
import { query } from "../../../../lib/db";
export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const where = ["o.payment_status = 'CHECKING'"];
    const params = [];

    if (q) {
      // ค้นหาได้จาก: เลขออเดอร์, โต๊ะ, ชื่อเมนู (ใน order_items), ชื่อสมาชิก/อีเมล
      where.push(`
        (
          o.order_code LIKE ?
          OR o.table_no LIKE ?
          OR EXISTS (
               SELECT 1 FROM order_items oi
               WHERE oi.order_id = o.id AND oi.name LIKE ?
             )
          OR EXISTS (
               SELECT 1 FROM users u2
               WHERE u2.id = o.user_id
                 AND (u2.name LIKE ? OR u2.email LIKE ?)
             )
        )
      `);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const rows = await query(
      `
      SELECT
        o.id,
        o.order_code,
        o.table_no,
        o.items_count,
        o.subtotal,
        o.service_rate,
        o.total,
        o.payment_status,
        o.payment_method,
        COALESCE(o.closed_at, o.created_at) AS closed_at,
        u.name  AS member_name,
        u.email AS member_email,
        (
          SELECT GROUP_CONCAT(CONCAT(oi.name,' x',oi.qty) ORDER BY oi.id SEPARATOR ', ')
          FROM order_items oi
          WHERE oi.order_id = o.id
        ) AS items_preview
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE ${where.join(" AND ")}
      ORDER BY COALESCE(o.closed_at, o.created_at) DESC
      `,
      params
    );

    return Response.json({ ok: true, items: rows });
  } catch (e) {
    console.error("GET /api/orders_done", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
