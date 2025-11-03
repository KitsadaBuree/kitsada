// app/api/foods/categories/route.js
import { query } from "../../../../../lib/db";
export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const withCount = searchParams.get("withCount") === "1";

    if (withCount) {
      const rows = await query(`
        SELECT
          c.id,
          c.name,
          COALESCE(COUNT(p.id), 0) AS count
        FROM categories c
        LEFT JOIN products p
          ON p.category_id = c.id           -- << เอา is_active ออก
        /* ถ้ามีคอลัมน์ c.is_active คงบรรทัดนี้ไว้; ถ้าไม่มี ให้ลบออก */
        WHERE c.is_active = 1
        GROUP BY c.id, c.name
        ORDER BY c.sort_order, c.id
      `);
      return Response.json({ ok: true, categories: rows.map(r => ({ ...r, count: Number(r.count) || 0 })) });
    }

    const rows = await query(`
      SELECT c.id, c.name
      FROM categories c
      /* ถ้าไม่มีคอลัมน์นี้ ให้ลบบรรทัดถัดไป */
      WHERE c.is_active = 1
      ORDER BY c.sort_order, c.id
    `);
    return Response.json({ ok: true, categories: rows });
  } catch (err) {
    console.error("GET /api/foods/categories error:", err);
    return Response.json({ ok:false, error: err.message }, { status: 500 });
  }
}
