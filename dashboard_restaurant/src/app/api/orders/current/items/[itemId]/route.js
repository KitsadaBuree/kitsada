import { query } from "../../../../../../../lib/db";
export const runtime = "nodejs";

export async function PATCH(req, { params }) {
  try {
    const id = Number(params.itemId);
    const body = await req.json();

    const sets = [];
    const args = [];
    if (body.qty != null)  { sets.push("qty = ?");   args.push(Math.max(1, Number(body.qty))); }
    if (body.note != null) { sets.push("note = ?");  args.push(String(body.note)); }
    if (body.status != null) {
      // สคีมารองรับ string → ส่งตรง 'doing' / 'ready' (หรือปล่อย NULL ถ้าไม่ต้องใช้)
      const s = body.status === "ready" ? "ready" : "doing";
      sets.push("status = ?"); args.push(s);
    }

    if (!sets.length) return Response.json({ ok: true });
    await query(`UPDATE order_items SET ${sets.join(", ")} WHERE id = ?`, [...args, id]); // ❌ no updated_at
    return Response.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/orders/current/items/:id", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.itemId);
    await query(`DELETE FROM order_items WHERE id = ?`, [id]);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/orders/current/items/:id", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
