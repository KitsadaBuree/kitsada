import { query } from "../../../../../../../lib/db";
export const runtime = "nodejs";

export async function DELETE(_req, ctx) {
  try {
    const { id, itemId } = await ctx.params;  // ⬅️ await params
    const orderIdNum = Number(id);
    const itemIdNum  = Number(itemId);
    if (!Number.isFinite(orderIdNum) || !Number.isFinite(itemIdNum)) {
      return Response.json({ ok: false, error: "bad id" }, { status: 400 });
    }

    const [row] = await query(
      "SELECT id, order_id FROM order_items WHERE id = ?",
      [itemIdNum]
    );
    if (!row || row.order_id !== orderIdNum) {
      return Response.json({ ok: false, error: "not found" }, { status: 404 });
    }

    await query("DELETE FROM order_items WHERE id = ?", [itemIdNum]);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/orders/[id]/items/[itemId]", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
