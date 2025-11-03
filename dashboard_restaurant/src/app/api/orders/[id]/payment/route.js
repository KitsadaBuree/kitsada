// src/app/api/orders/[id]/payment/route.js
import { query } from "../../../../../../lib/db";
import { verifyAuthToken } from "../../../../../../lib/auth";
export const runtime = "nodejs";

/* ---------- auth helpers ---------- */
const BLOCKED = new Set(["", "guest", "viewer"]);
function allow(role) {
  const v = String(role || "").toLowerCase();
  if (BLOCKED.has(v)) return false;
  return !!v; // อนุญาต role อื่น ๆ ทั้งหมด
}
function readToken(req) {
  const cookie = req.headers.get("cookie") || "";
  const t1 = (cookie.match(/auth_token=([^;]+)/) || [])[1] || "";
  const auth = req.headers.get("authorization") || "";
  const t2 = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return t1 || t2;
}
function isDevBypass() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_ALL_IN_DEV === "true";
}

async function ensureAuth(req) {
  if (isDevBypass()) return { ok: true, payload: { role: "dev" } };
  const token = readToken(req);
  if (!token) return { ok: false, status: 401, error: "unauthorized" };
  try {
    const payload = await verifyAuthToken(token);
    if (!allow(payload?.role)) return { ok: false, status: 403, error: "forbidden" };
    return { ok: true, payload };
  } catch {
    return { ok: false, status: 401, error: "unauthorized" };
  }
}

/* ---------- POST: บันทึกการชำระ ---------- */
export async function POST(req, ctx) {
  const auth = await ensureAuth(req);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id } = await ctx.params; // ⬅️ ต้อง await
  const oid = Number(id);
  if (!Number.isFinite(oid)) return Response.json({ ok: false, error: "bad id" }, { status: 400 });

  let body = {};
  try { body = await req.json(); } catch {}
  const method = String(body?.method || "CASH").toUpperCase();
  const amount = Number(body?.amount || 0);

  try {
    // อัปเดตสถานะการชำระ
    await query(
      `UPDATE orders
         SET payment_status = 'PAID',
             payment_method = ?,
             total = CASE WHEN ? > 0 THEN ? ELSE total END,
             closed_at = COALESCE(closed_at, NOW())
       WHERE id = ?`,
      [method, amount, amount, oid]
    );

    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/orders/[id]/payment", e);
    return Response.json({ ok: false, error: "update failed" }, { status: 500 });
  }
}

/* ---------- DELETE: ยกเลิกการชำระ ---------- */
export async function DELETE(req, ctx) {
  const auth = await ensureAuth(req);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const oid = Number(id);
  if (!Number.isFinite(oid)) return Response.json({ ok: false, error: "bad id" }, { status: 400 });

  try {
    // ย้อนกลับสถานะเป็น UNPAID (หรือจะเปลี่ยนเป็น CHECKING ก็ได้)
    await query(
      `UPDATE orders
         SET payment_status = 'UNPAID',
             payment_method = NULL
       WHERE id = ?`,
      [oid]
    );

    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/orders/[id]/payment", e);
    return Response.json({ ok: false, error: "revert failed" }, { status: 500 });
  }
}
