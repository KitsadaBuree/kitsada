// src/app/api/kitchen/orders/[id]/items/[itemId]/route.js
import { query } from "../../../../../../../../lib/db";
import { verifyAuthToken } from "../../../../../../../../lib/auth";

export const runtime = "nodejs";

function canKitchen(role) {
  const r = String(role || "").toLowerCase();
  return r === "kitchen" || r === "manager";
}

const ITEM_STATUS_MAP = { cooking: "doing", ready: "done" };

async function auth(req) {
  const cookie = req.headers.get("cookie") || "";
  const token = (cookie.match(/auth_token=([^;]+)/) || [])[1];
  if (!token) throw new Error("unauthorized");
  const payload = await verifyAuthToken(token);
  if (!canKitchen(payload?.role)) throw new Error("forbidden");
}

export async function PUT(req, ctx) {
  try {
    await auth(req);
  } catch (e) {
    const msg = e.message === "forbidden" ? "forbidden" : "unauthorized";
    return Response.json({ ok: false, error: msg }, { status: msg === "forbidden" ? 403 : 401 });
  }

  // ✅ ต้อง await params ก่อนใช้
  const { id, itemId } = await ctx.params;
  const oid = Number(id);
  const iid = Number(itemId);
  if (!oid || !iid) return Response.json({ ok: false, error: "bad id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const orderNext = String(body?.status || "").toLowerCase(); // 'cooking' | 'ready'
  const itemNext = ITEM_STATUS_MAP[orderNext];
  if (!itemNext) return Response.json({ ok: false, error: "invalid status" }, { status: 400 });

  // 1) update รายการเดียว
  const r = await query(
    `UPDATE order_items SET status=? WHERE id=? AND order_id=?`,
    [itemNext, iid, oid]
  );
  if (!r?.affectedRows) {
    return Response.json({ ok: false, error: "item not found" }, { status: 404 });
  }

  // 2) เช็กสถานะรวมของใบออเดอร์
  const [aggRows] = await query(
    `SELECT
        SUM(status IN ('queued','doing')) AS not_done,
        COUNT(*) AS total
     FROM order_items
     WHERE order_id=?`,
    [oid]
  );
  const agg = Array.isArray(aggRows) ? aggRows[0] : aggRows;

  if (Number(agg?.total || 0) > 0 && Number(agg?.not_done || 0) === 0) {
    await query(`UPDATE orders SET status='ready' WHERE id=?`, [oid]);
  } else {
    await query(`UPDATE orders SET status='cooking' WHERE id=?`, [oid]);
  }

  return Response.json({ ok: true });
}
