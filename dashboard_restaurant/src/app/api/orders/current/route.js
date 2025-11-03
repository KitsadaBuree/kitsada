import { ensureDraftOrder } from "../_utils";
export const runtime = "nodejs";

export async function GET() {
  try {
    const order = await ensureDraftOrder();
    return Response.json({ ok: true, order });
  } catch (e) {
    console.error("GET /api/orders/current", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
