// src/app/api/kitchen/orders/route.js
import { query } from "../../../../../lib/db";
import { verifyAuthToken } from "../../../../../lib/auth";

export const runtime = "nodejs";

const ALLOW_STAT = new Set(["pending", "cooking", "ready"]);
const KITCHEN_STAT_LIST = "('pending','cooking','ready')";

function canKitchen(role) {
  const r = String(role || "").toLowerCase();
  return r === "kitchen" || r === "manager";
}

export async function GET(req) {
  // ---- auth (เฉพาะ kitchen/manager) ----
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

  // ---- params ----
  const { searchParams } = new URL(req.url);
  const rawStatus = (searchParams.get("status") || "all").toLowerCase();
  const mapIn = { new: "pending", doing: "cooking", done: "ready" };
  const status = mapIn[rawStatus] ?? rawStatus; // map ค่าแท็บ/เก่าๆ -> DB
  const q = (searchParams.get("q") || "").trim();

  // ---- WHERE ----
  const where = [];
  const args = [];

  // 1) ซ่อนออเดอร์ที่จ่ายแล้ว
  where.push("(o.payment_status IS NULL OR o.payment_status <> 'PAID')");

  // 2) filter ตามแท็บ
  if (status !== "all") {
    if (ALLOW_STAT.has(status)) {
      where.push("o.status = ?");
      args.push(status);
    } else {
      where.push(`o.status IN ${KITCHEN_STAT_LIST}`);
    }
  } else {
    where.push(`o.status IN ${KITCHEN_STAT_LIST}`);
  }

  // 3) ค้นหาโต๊ะ
  if (q) {
    where.push("o.table_no LIKE ?");
    args.push(`%${q}%`);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // ---- query (เรียงใหม่อยู่บนสุด) ----
  const rows = await query(
    `
    SELECT
      o.id,
      o.order_code,
      o.table_no,
      o.note,
      o.status,
      o.created_at,
      i.id     AS item_id,
      i.name   AS item_name,
      i.qty,
      i.status AS item_status,
      i.note   AS item_note
    FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.id
    ${whereSQL}
    ORDER BY
      (o.status='pending') DESC,
      (o.status='cooking') DESC,
      o.created_at DESC,
      o.id DESC,
      i.id ASC
    `,
    args
  );

  // ---- group ต่อออเดอร์ (preserve insertion order) ----
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.id)) {
      m.set(r.id, {
        id: r.id,
        order_code: r.order_code || null,
        table_no: r.table_no,
        note: r.note || "",
        status: r.status,
        created_at: r.created_at,
        items: [],
      });
    }
    if (r.item_id) {
      m.get(r.id).items.push({
        id: r.item_id,
        name: r.item_name,
        qty: r.qty,
        status: r.item_status,
        note: r.item_note || "",
      });
    }
  }

  return Response.json({ ok: true, data: Array.from(m.values()) });
}
