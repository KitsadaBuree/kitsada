import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const table = (searchParams.get("table_no") || "").trim();
    if (!table) {
      return NextResponse.json({ ok:false, error:"table_no required" }, { status:400 });
    }

    const rows = await query(
      `SELECT SUM(oi.qty) AS items_count
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.table_no = ?
          AND (o.payment_status IS NULL OR o.payment_status <> 'PAID')
          AND (o.status IS NULL OR o.status <> 'canceled')`,
      [table]
    );
    const count = Number(rows?.[0]?.items_count || 0);
    return NextResponse.json({ ok:true, data:{ count } }, { status:200, headers:{ "Cache-Control":"no-store" }});
  } catch (e) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
