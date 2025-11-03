// src/app/api/tables/check/route.js
import { query } from "../../../../../lib/db";

export async function POST(req) {
  const { numbers } = await req.json().catch(() => ({}));
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return Response.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  // สมมติ “เลขโต๊ะ” เก็บในตาราง tables คอลัมน์ name (เป็น string ตัวเลข)
  // ถ้าเก็บในคอลัมน์อื่น ปรับให้ตรง
  const placeholders = numbers.map(() => "?").join(",");
  const rows = await query(
    `SELECT name FROM tables WHERE name IN (${placeholders})`,
    numbers.map(n => String(n))
  );

  const exist = rows.map(r => Number(r.name)).filter(Number.isFinite);
  return Response.json({ ok: true, exist });
}
