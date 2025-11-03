// src/app/api/productsAPI/route.js
import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // ✅ join ตาราง categories เพื่อดึงชื่อหมวดหมู่
    const rows = await query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.imageUrl,
        c.name AS category
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.id DESC
    `);

    // ✅ จัดรูปแบบข้อมูลให้พร้อมใช้งาน
    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      imageUrl: r.imageUrl,
      category: r.category || "-", // ถ้าไม่มีหมวดจะได้ "-"
    }));

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
