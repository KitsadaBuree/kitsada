// app/api/orders_done/[id]/route.js
import { query } from "../../../../../lib/db";
import { verifyAuthToken } from "../../../../../lib/auth";

export const runtime = "nodejs";

const ALLOW = new Set([
  "manager", "employee", "admin", "administrator", "cashier", "staff",
]);
const allow = (r) => ALLOW.has(String(r || "").toLowerCase());

function readToken(req) {
  const cookie = req.headers.get("cookie") || "";
  const t1 = (cookie.match(/auth_token=([^;]+)/) || [])[1] || "";
  const auth = req.headers.get("authorization") || "";
  const t2 = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return t1 || t2;
}

// map สถานะจาก DB -> UI
function normStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "doing") return "cooking";
  if (v === "done") return "ready";
  if (v === "queued") return "pending";
  return v;
}

export async function GET(req, ctx) {
  // --- auth ---
  const token = readToken(req);
  if (!token) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = await verifyAuthToken(token);
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!allow(payload?.role)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // --- params ---
  const { id } = await ctx.params; // Next 15 ต้อง await
  const oid = Number(id);
  if (!oid) return Response.json({ ok: false, error: "invalid id" }, { status: 400 });

  try {
    // 1) หัวออเดอร์ + ยอด + การชำระ + สมาชิก
    const [o0] = await query(
      `SELECT
         o.id, o.order_code, o.table_no, o.status, o.note, o.created_at, o.closed_at,
         o.subtotal, o.service_rate, o.service_charge, o.discount, o.total,
         o.payment_status, o.payment_method,
         u.name  AS member_name,
         u.email AS member_email
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.id = ?
       LIMIT 1`,
      [oid]
    );
    if (!o0) return Response.json({ ok: false, error: "not found" }, { status: 404 });

    // 2) รายการอาหาร (มี unit_price)
    let itemRows;
    try {
      itemRows = await query(
        `SELECT
           oi.id,
           COALESCE(p.name, oi.name) AS name,
           oi.qty,
           oi.unit_price AS unit_price,
           oi.status     AS item_status,
           oi.note
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?
         ORDER BY oi.id ASC`,
        [oid]
      );
    } catch {
      // fallback: ถ้าไม่มี unit_price ในตาราง
      itemRows = await query(
        `SELECT
           oi.id,
           COALESCE(p.name, oi.name) AS name,
           oi.qty,
           oi.price AS unit_price,
           oi.status     AS item_status,
           oi.note
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?
         ORDER BY oi.id ASC`,
        [oid]
      );
    }

    const items = itemRows.map((r) => ({
      id: r.id,
      name: r.name,
      qty: r.qty,
      unit_price: r.unit_price,
      status: normStatus(r.item_status),
      note: r.note || "",
    }));

    // 3) สถานะออเดอร์ (อ้างอิงรายการเพื่อกันหัวบิลค้าง)
    let orderStatus = normStatus(o0.status);
    if (items.length) {
      const allReady = items.every((it) => it.status === "ready");
      const anyCooking = items.some((it) => it.status === "cooking");
      const anyPending = items.some((it) => it.status === "pending");
      if (allReady) orderStatus = "ready";
      else if (anyCooking) orderStatus = "cooking";
      else if (anyPending) orderStatus = "pending";
    }

    // 4) คืนค่าให้ UI — ใช้ยอดจาก DB ตรง ๆ เพื่อให้ตรงกับบิลลูกค้า
    return Response.json({
      ok: true,
      data: {
        id: o0.id,
        order_code: o0.order_code,
        table_no: o0.table_no,
        status: orderStatus,
        note: o0.note || "",
        created_at: o0.created_at,
        closed_at: o0.closed_at,

        // member (ถ้ามี)
        member_name: o0.member_name || "",
        member_email: o0.member_email || "",

        // amounts (ตรงกับบิล)
        subtotal: Number(o0.subtotal || 0),
        service_rate: Number(o0.service_rate || 0),
        service_charge: Number(o0.service_charge || 0),
        discount: Number(o0.discount || 0),
        total: Number(o0.total || 0),

        // payment
        payment_status: o0.payment_status || "UNPAID",
        payment_method: o0.payment_method || null,

        items,
      },
    });
  } catch (e) {
    console.error("GET /api/orders_done/[id] error:", e);
    return Response.json({ ok: false, error: "query failed" }, { status: 500 });
  }
}
