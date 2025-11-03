// src/app/api/orders_done/[id]/payment/route.js
import { query } from "../../../../../../lib/db";
import { verifyAuthToken } from "../../../../../../lib/auth";

export const runtime = "nodejs";

/* ---------- auth helpers ---------- */
const BLOCKED = new Set(["", "guest", "viewer"]);
function allow(role) {
  const v = String(role || "").toLowerCase();
  if (BLOCKED.has(v)) return false;
  return !!v;
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

/* ---------- method coercion (allow: cash/qr only) ---------- */
async function coercePaymentMethodForDB(raw) {
  const ui = String(raw || "CASH").toLowerCase();

  // map ฝั่ง UI → กลุ่มที่รองรับ
  const isQR = ["qr", "transfer", "bank", "promptpay", "โอน"].includes(ui);
  const uiKey = isQR ? "qr" : "cash"; // default เป็น cash

  // ดู schema จริงของคอลัมน์
  const rows = await query(
    `SELECT DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH AS maxlen
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'payment_method'
      LIMIT 1`
  );
  const col = rows[0] || {};
  const dataType = String(col?.DATA_TYPE || "").toLowerCase();

  // ถ้าเป็น ENUM: เลือกค่าที่มีอยู่จริง
  if (dataType === "enum") {
    const ct = String(col?.COLUMN_TYPE || ""); // e.g. enum('cash','qr','card')
    const opts = Array.from(ct.matchAll(/'([^']+)'/g)).map((m) => m[1]); // ['cash','qr',...]
    const prefMap = {
      cash: ["cash", "CASH", "เงินสด"],
      qr: ["qr", "QR", "transfer", "bank", "promptpay", "โอน"],
    };
    const candidates = prefMap[uiKey];

    // หาค่าใน enum ที่ match (case-insensitive)
    for (const cand of candidates) {
      const hit = opts.find((o) => o.toLowerCase() === cand.toLowerCase());
      if (hit) return hit;
    }
    // ถ้าไม่เจอเลย (เช่น schema ยังไม่มี 'qr') — fallback ตัวแรกกัน error
    return opts[0] || "cash";
  }

  // ถ้าเป็น VARCHAR/CHAR: ตัดความยาวให้พอดี
  const maxlen = Number(col?.maxlen || 16);
  const value = uiKey === "qr" ? "qr" : "cash";
  return value.slice(0, Math.max(1, maxlen));
}

/* ---------- POST ---------- */
export async function POST(req, ctx) {
  const auth = await ensureAuth(req);
  if (!auth.ok) return Response.json({ ok:false, error:auth.error }, { status:auth.status });

  const { id } = await ctx.params; // Next 15 ต้อง await
  const oid = Number(id);
  if (!Number.isFinite(oid)) return Response.json({ ok:false, error:"bad id" }, { status:400 });

  let body = {};
  try { body = await req.json(); } catch {}
  const amount = Number(body?.amount || 0);

  try {
    // อ่านยอดจริงจาก DB
    const [row] = await query(`SELECT total FROM orders WHERE id=? LIMIT 1`, [oid]);
    if (!row) return Response.json({ ok:false, error:"not found" }, { status:404 });

    // เช็คความตรงกันของ amount ถ้ามีส่งมา
    if (amount > 0 && Number(row.total) !== amount) {
      return Response.json({ ok:false, error:"amount mismatch with calculated total" }, { status:422 });
    }

    // map วิธีชำระให้ตรง schema และอนุญาตเฉพาะ cash/qr
    const methodForDB = await coercePaymentMethodForDB(body?.method);

    await query(
      `UPDATE orders
         SET payment_status = 'PAID',
             payment_method = ?,
             closed_at = COALESCE(closed_at, NOW())
       WHERE id = ?`,
      [methodForDB, oid]
    );

    return Response.json({ ok:true, method: methodForDB });
  } catch (e) {
    console.error("POST /api/orders_done/[id]/payment", e);
    return Response.json({ ok:false, error:"update failed" }, { status:500 });
  }
}

/* ---------- DELETE ---------- */
export async function DELETE(req, ctx) {
  const auth = await ensureAuth(req);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const oid = Number(id);
  if (!Number.isFinite(oid)) return Response.json({ ok: false, error: "bad id" }, { status: 400 });

  try {
    await query(
      `UPDATE orders
         SET payment_status = 'UNPAID',
             payment_method = NULL
       WHERE id = ?`,
      [oid]
    );
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/orders_done/[id]/payment", e);
    return Response.json({ ok: false, error: "revert failed" }, { status: 500 });
  }
}
