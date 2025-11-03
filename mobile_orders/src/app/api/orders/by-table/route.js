// src/app/api/orders/by-table/route.js
import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const table = (searchParams.get("table_no") || searchParams.get("table") || "").trim();
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 30), 1), 100);

    // ตัวเลือก:
    //  - include_paid=1   => รวมบิลที่ไม่ใช่ UNPAID ด้วย
    //  - include_closed=1 => รวมบิลที่ปิดแล้ว (closed_at ไม่เป็น NULL) ด้วย
    const includePaid   = searchParams.get("include_paid")   == "1";
    const includeClosed = searchParams.get("include_closed") == "1";

    if (!table) {
      return NextResponse.json({ ok: false, error: "missing table_no" }, { status: 400 });
    }

    const where = ["table_no = ?"];
    const args  = [table];

    // ✅ ค่าเริ่มต้น: เอาเฉพาะใบที่ยังไม่ได้จ่ายจริง ๆ
    if (!includePaid) {
      where.push("payment_status = 'UNPAID'");
    }

    // ✅ ค่าเริ่มต้น: เอาเฉพาะใบที่ยังไม่ถูกปิดบิล
    if (!includeClosed) {
      where.push("closed_at IS NULL");
    }

    // กันเคสยกเลิก
    where.push("(status IS NULL OR status <> 'canceled')");

    const rows = await query(
      `
        SELECT
          id,
          order_code,
          table_no,
          items_count,
          subtotal,
          service_rate,
          service_charge,
          total,
          note,
          status,
          payment_status,
          created_at,
          closed_at
        FROM orders
        WHERE ${where.join(" AND ")}
        ORDER BY id DESC
        LIMIT ?
      `,
      [...args, limit]
    );

    return NextResponse.json(
      { ok: true, data: rows },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
