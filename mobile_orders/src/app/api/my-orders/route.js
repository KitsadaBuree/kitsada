import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    // หา user id จาก cookie
    const ck = await cookies();
    const token = ck.get(COOKIE_NAME)?.value || "";
    const payload = token ? verifyToken(token) : null;
    const userId = Number(payload?.id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // ดึงเฉพาะออเดอร์ของ user นี้ (ซ่อนไว้รายการที่ยกเลิกได้ถ้าอยาก)
    const rows = await query(
      `SELECT id, order_code, table_no, total, discount, service_charge, created_at, payment_status, status
         FROM orders
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 100`,
      [userId]
    );

    return NextResponse.json({ ok: true, data: rows }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
