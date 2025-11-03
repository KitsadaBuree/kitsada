// src/app/api/orders/route.js
import { query } from "../../../../lib/db";
export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "").trim();
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") || 20)));
    const offset = (page - 1) * pageSize;

    const hidePaid     = (searchParams.get("hidePaid") || "") === "1";
    const hideChecking = (searchParams.get("hideChecking") || "") === "1";

    const where = [];
    const params = [];

    if (status) { where.push("status = ?"); params.push(status); }

    if (q) {
      // ค้นหาหลายฟิลด์
      where.push(`(
        order_code LIKE ?
        OR table_no LIKE ?
        OR CAST(id AS CHAR) LIKE ?
        OR status LIKE ?
        OR payment_status LIKE ?
      )`);
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }

    const hides = [];
    if (hidePaid) hides.push("PAID");
    if (hideChecking) hides.push("CHECKING");
    if (hides.length) {
      where.push(`payment_status NOT IN (${hides.map(()=>"?" ).join(",")})`);
      params.push(...hides);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await query(
      `SELECT id, order_code, table_no, items_count, subtotal, service_rate, service_charge,
              discount, total, status, payment_status, created_at
         FROM orders
         ${whereSql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const [{ c: total = 0 } = {}] = await query(
      `SELECT COUNT(*) AS c FROM orders ${whereSql}`,
      params
    );

    return Response.json({ ok:true, items:rows, total, page, pageSize });
  } catch (e) {
    console.error("GET /api/orders", e);
    return Response.json({ ok:false, error:e.message }, { status:500 });
  }
}
