import { ensureDraftOrder } from "../../_utils";
import { query } from "../../../../../../lib/db";
export const runtime = "nodejs";

export async function POST() {
  try {
    const order = await ensureDraftOrder();

    const [{ c }] = await query(
      `SELECT COUNT(*) AS c FROM order_items WHERE order_id = ?`,
      [order.id]
    );
    if (!Number(c)) {
      return Response.json({ ok: false, error: "ยังไม่มีรายการอาหาร" }, { status: 400 });
    }
      // ถ้าระบบของคุณมีค่า 'confirmed'/'submitted' ใน ENUM ให้ใช้ค่าที่รองรับ
      // ถ้ายังไม่มี ก็ยังคง 'pending' ได้ แล้วไปปิดงานด้วยคอลัมน์เวลา/การจ่ายเงินแทน
      await query(`UPDATE orders SET status = 'pending' WHERE id = ?`, [order.id]);

    return Response.json({ ok: true, order_id: order.id });
  } catch (e) {
    console.error("POST /api/orders/current/submit", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
