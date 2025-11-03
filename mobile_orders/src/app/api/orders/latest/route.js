import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const table = (searchParams.get("table") || "").trim();
    if (!table) {
      return NextResponse.json({ ok:false, error:"missing table" }, { status:400 });
    }

    const o = await query(
      "SELECT * FROM orders WHERE table_no=? ORDER BY id DESC LIMIT 1",
      [table]
    );
    if (!o.length) {
      return NextResponse.json({ ok:false, error:"no order" }, { status:404 });
    }
    const order = o[0];

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

    return NextResponse.json({ ok:true, data: { order, items } }, { status:200 });
  } catch (e) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
