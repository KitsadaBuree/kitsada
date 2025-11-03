// src/app/api/kitchen/orders/[id]/route.js
import { query } from "../../../../../../lib/db";
import { verifyAuthToken } from "../../../../../../lib/auth";

export const runtime = "nodejs";

function canKitchen(role) {
  const r = String(role || "").toLowerCase();
  return r === "kitchen" || r === "manager";
}

// map สถานะที่ UI ใช้ -> สถานะในตาราง order_items
const ITEM_STATUS_FROM_ORDER = {
  cooking: { from: "queued", to: "doing" },
  ready:   { from: "doing",  to: "done"  },
};

async function handler(req, ctx) {
  const { id } = await ctx.params;
  const oid = Number(id);
  if (!oid) return Response.json({ ok: false, error: "bad id" }, { status: 400 });

  // --- auth ---
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
  const next = String(body?.status || "").toLowerCase(); // 'cooking' | 'ready'
  if (!["cooking", "ready"].includes(next)) {
    return Response.json({ ok: false, error: "invalid status" }, { status: 400 });
  }

  // --- update orders.status ---
  await query(`UPDATE orders SET status=? WHERE id=?`, [next, oid]);

  // --- cascade ไปยัง order_items ตามสเต็ป ---
  const step = ITEM_STATUS_FROM_ORDER[next];
  await query(
    `UPDATE order_items SET status=? WHERE order_id=? AND status=?`,
    [step.to, oid, step.from]
  );

  return Response.json({ ok: true });
}

// รองรับทั้ง PUT และ PATCH ให้ชัวร์กับฝั่ง UI
export async function PUT(req, ctx)   { return handler(req, ctx); }
export async function PATCH(req, ctx) { return handler(req, ctx); }
