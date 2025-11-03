// app/api/orders/[id]/route.js
import { query } from "../../../../../lib/db";
export const runtime = "nodejs";

export async function GET(_req, ctx) {
  try {
    const { id } = await ctx.params;
    const oid = Number(id);
    if (!Number.isFinite(oid) || oid <= 0) {
      return Response.json({ ok:false, error:"bad id" }, { status:400 });
    }

    const rows = await query(
      `SELECT
         id, order_code, table_no, items_count,
         subtotal, service_rate, service_charge, discount, total,
         status, payment_status, payment_method,
         opened_at, closed_at, created_at, note
       FROM orders
       WHERE id = ?`,
      [oid]
    );

    if (!rows.length) {
      return Response.json({ ok:false, error:"not found" }, { status:404 });
    }

    const order = rows[0];
    return Response.json({ ok:true, order });
  } catch (e) {
    console.error("GET /api/orders/[id] error:", e);
    return Response.json({ ok:false, error: e.message || "query failed" }, { status:500 });
  }
}
