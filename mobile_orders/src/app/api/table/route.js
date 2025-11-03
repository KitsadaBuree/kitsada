// app/api/table/route.js
import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const id   = searchParams.get("id");

    if (!code && !id) {
      return NextResponse.json({ ok:false, error:"missing code or id" }, { status:400 });
    }

    // ปรับให้ตรง schema ของคุณ: ลองหลายแบบที่พบบ่อย
    const sqls = id
      ? [
          ["SELECT id, number, name FROM tables WHERE id=? LIMIT 1", [Number(id)]],
          ["SELECT id, table_no  AS number, title AS name FROM tables WHERE id=? LIMIT 1", [Number(id)]],
          ["SELECT id, name FROM tables WHERE id=? LIMIT 1", [Number(id)]],
        ]
      : [
          ["SELECT id, number, name FROM tables WHERE code=? AND active=1 LIMIT 1", [code]],
          ["SELECT id, number, name FROM tables WHERE code=? LIMIT 1", [code]],
          ["SELECT id, table_no AS number, title AS name FROM tables WHERE table_code=? LIMIT 1", [code]],
          ["SELECT id, name FROM tables WHERE code=? LIMIT 1", [code]],
        ];

    let row = null;
    for (const [sql, params] of sqls) {
      try {
        const rows = await query(sql, params);
        if (rows?.length) { row = rows[0]; break; }
      } catch {
        // เงียบไว้ ถ้า column ไม่ตรงจะ throw ก็ข้ามไปลองอันถัดไป
      }
    }

    if (!row) {
      return NextResponse.json({ ok:false, error:"not found" }, { status:404 });
    }

    // ทำให้แน่ใจว่ามีชื่อ/หมายเลขสักอย่าง
    const data = {
      id: row.id,
      number: row.number ?? null,
      name: row.name ?? (row.number != null ? String(row.number) : null),
    };

    return NextResponse.json({ ok:true, data }, { status:200 });
  } catch (e) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
