// src/app/api/tables/route.js
import { query } from "../../../../lib/db";

export async function GET() {
  try {
    const rows = await query(
      `
      SELECT
        t.id,
        t.code,
        t.name,
        t.active,
        t.created_at,
        COALESCE(SUM(
          CASE
            WHEN o.payment_status IN ('UNPAID','CHECKING')
                 AND (o.closed_at IS NULL)        -- ยังไม่ปิดบิล
            THEN 1 ELSE 0
          END
        ), 0) AS open_orders
      FROM tables t
      LEFT JOIN orders o
        ON (
             -- เลือกเงื่อนไขให้ตรงสคีมาโปรเจกต์คุณ
             o.table_no = t.name                 -- ถ้า orders เก็บหมายเลขโต๊ะเป็นตัวเลข/ชื่อ
             OR o.table_id = t.id                -- ถ้ามีคอลัมน์อ้างอิงโดยตรง
           )
      GROUP BY t.id, t.code, t.name, t.active, t.created_at
      ORDER BY t.id ASC
      `,
      []
    );

    return Response.json({ ok: true, data: rows, total: rows.length });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false, error: "DB error" }, { status: 500 });
  }
}
