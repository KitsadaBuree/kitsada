//src/app/api/orders/[code]/route.js
import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
export const runtime = "nodejs";

// GET /api/orders/:code
export async function GET(_req, ctx) {
  try {
    const { code } = await ctx.params;          // <-- ต้อง await
    const idMaybe = Number(code) || 0;

    const rows = await query(
      "SELECT * FROM orders WHERE order_code=? OR id=? LIMIT 1",
      [String(code), idMaybe]
    );
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const order = rows[0];

    // ---- Normalize service ----
    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discount || 0);
    const rateRaw = Number(order.service_rate || 0);
    const rate = rateRaw > 1 ? rateRaw / 100 : rateRaw;
    const serviceChargeCalc =
      order.service_charge != null
        ? Number(order.service_charge)
        : Number(((subtotal - discount) * rate).toFixed(2));

    order.service_rate_pct = Math.round(rate * 100);
    order.service_rate_norm = rate;
    order.service_charge_calc = serviceChargeCalc;

    const items = await query(
      `SELECT oi.id, oi.product_id, p.imageUrl AS imageUrl,
              oi.name, oi.unit_price, oi.qty, oi.status,
              oi.line_total, oi.note
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.id ASC`,
      [order.id]
    );

    return NextResponse.json({ ok: true, data: { order, items } }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
