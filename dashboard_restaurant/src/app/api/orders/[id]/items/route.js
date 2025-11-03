// app/api/orders/[id]/items/route.js
import { query } from "../../../../../../lib/db";
export const runtime = "nodejs";

// helper: ตรวจว่าคอลัมน์มีอยู่จริงไหม
async function hasCol(table, col) {
  const rows = await query(
    `SELECT 1
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = ?
        AND COLUMN_NAME  = ?
      LIMIT 1`,
    [table, col]
  );
  return rows.length > 0;
}

// map สถานะจาก DB -> UI
function normCookStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "done")   return "ready";
  if (v === "doing")  return "cooking";
  if (v === "queued") return "pending";
  return v; // ถ้า DB ใช้ ready/cooking/pending อยู่แล้ว
}

export async function GET(_req, ctx) {
  try {
    const { id } = await ctx.params;
    const orderId = Number(id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return Response.json({ ok:false, error:"bad id" }, { status:400 });
    }

    // สร้าง column สำหรับชื่อ/รูป/หมวด ตาม schema ที่มีจริง
    const hasImageUrlSnake = await hasCol("products", "image_url");
    const hasImageUrlCamel = await hasCol("products", "imageUrl");
    const imgCol = hasImageUrlSnake ? "p.image_url"
                : hasImageUrlCamel ? "p.imageUrl"
                : "NULL";

    const hasProdName = await hasCol("products", "name");
    const nameCol = hasProdName ? "COALESCE(p.name, oi.name)" : "oi.name";

    const hasCategory = await hasCol("products", "category");
    const categoryCol = hasCategory ? "p.category" : "NULL";

    // ดึง items (เอา status มาในชื่อ item_status)
    const raw = await query(
      `SELECT
         oi.id,
         oi.order_id,
         oi.product_id,
         oi.qty,
         oi.status       AS item_status,
         oi.note,
         ${nameCol}      AS name,
         oi.unit_price   AS unit_price,
         ${imgCol}       AS image_url,
         ${categoryCol}  AS category
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [orderId]
    );

    // แปลงสถานะให้ UI ใช้ได้
    const items = raw.map(r => ({
      id: r.id,
      order_id: r.order_id,
      product_id: r.product_id,
      qty: r.qty,
      status: normCookStatus(r.item_status), // 👈 สำคัญ
      note: r.note || "",
      name: r.name,
      unit_price: r.unit_price,
      image_url: r.image_url,
      category: r.category,
    }));

    // service_rate ไว้คูณใน UI
    const orows = await query(`SELECT service_rate FROM orders WHERE id = ?`, [orderId]);
    const service_rate = Number(orows[0]?.service_rate ?? 0);

    return Response.json({ ok:true, items, service_rate });
  } catch (e) {
    console.error("GET /api/orders/[id]/items Error:", e);
    return Response.json({ ok:false, error: e.sqlMessage || e.message }, { status:500 });
  }
}
