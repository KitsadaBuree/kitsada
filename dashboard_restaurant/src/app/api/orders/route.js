// src/app/api/orders/route.js
import { query } from "../../../../lib/db";
import crypto from "crypto";
export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status   = (searchParams.get("status") || "").trim();
    const q        = (searchParams.get("q") || "").trim();

    const page     = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") || 20)));
    const offset   = (page - 1) * pageSize;
    const LIMIT_SQL  = String(parseInt(pageSize, 10));
    const OFFSET_SQL = String(parseInt(offset, 10));

    const hidePaid     = (searchParams.get("hidePaid") || "") === "1";
    const hideChecking = (searchParams.get("hideChecking") || "") === "1";

    const where = [];
    const params = [];
    if (status) { where.push("status = ?"); params.push(status); }
    if (q) {
      where.push(`(
        order_code LIKE ? OR table_no LIKE ? OR CAST(id AS CHAR) LIKE ?
        OR status LIKE ? OR payment_status LIKE ?
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

    // หลัก: ดึงรายการตามปกติ
    const listSql = `
      SELECT id, order_code, table_no, items_count, subtotal, service_rate, service_charge,
             discount, total, status, payment_status, created_at
        FROM orders
        ${whereSql}
       ORDER BY id DESC
       LIMIT ${LIMIT_SQL} OFFSET ${OFFSET_SQL}`;
    const rows = await query(listSql, params);

    const [{ c: total = 0 } = {}] = await query(`SELECT COUNT(*) AS c FROM orders ${whereSql}`, params);

    // สร้าง fingerprint แล้วทำ ETag
    const fp = rows.map(o =>
      [o.id, o.order_code, o.table_no, o.items_count, o.status, o.payment_status, o.created_at || ""].join("|")
    ).join(";");
    const etag = `"orders:${crypto.createHash("sha1").update(fp).digest("hex")}"`;

    // ถ้าลูกค้าส่ง If-None-Match มา และตรง → 304
    const inm = req.headers.get("if-none-match");
    if (inm && inm === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }

    return new Response(JSON.stringify({ ok:true, items:rows, total, page, pageSize }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "ETag": etag,
      },
    });
  } catch (e) {
    console.error("GET /api/orders", e);
    return Response.json({ ok:false, error:e.message }, { status:500 });
  }
}
