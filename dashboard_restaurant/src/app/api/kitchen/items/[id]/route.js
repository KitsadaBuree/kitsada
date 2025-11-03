import { query } from "../../../../../../lib/db";
import { verifyAuthToken } from "../../../../../../lib/auth";

export const runtime = "nodejs";

function canKitchen(role) {
  const r = String(role || "").toLowerCase();
  return r === "kitchen" || r === "manager";
}

export async function PATCH(req, ctx) {
  const { id } = await ctx.params;
  const iid = Number(id);
  if (!iid) return Response.json({ ok: false, error: "bad id" }, { status: 400 });

  const cookie = req.headers.get("cookie") || "";
  const token = (cookie.match(/auth_token=([^;]+)/) || [])[1];
  if (!token) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const payload = await verifyAuthToken(token);
    if (!canKitchen(payload?.role)) {
      return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const next = String(body?.status || "").toLowerCase(); // 'doing' | 'done'
  if (!["doing", "done"].includes(next)) {
    return Response.json({ ok: false, error: "invalid status" }, { status: 400 });
  }

  await query(`UPDATE order_items SET status=? WHERE id=?`, [next, iid]);
  return Response.json({ ok: true });
}
