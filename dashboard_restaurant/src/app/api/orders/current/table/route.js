import { ensureDraftOrder } from "../../_utils";
import { query } from "../../../../../../lib/db";
export const runtime = "nodejs";

export async function PATCH(req) {
  try {
    const order = await ensureDraftOrder();
    const { table_no } = await req.json();        // ส่ง "" เพื่อล้างค่าได้
    await query(`UPDATE orders SET table_no = ? WHERE id = ?`, [table_no || null, order.id]);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/orders/current/table", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
