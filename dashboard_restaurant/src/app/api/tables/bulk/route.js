// src/app/api/tables/bulk/route.js
import { query } from "../../../../../lib/db";
export async function POST(req) {
  const { numbers } = await req.json().catch(()=>({}));
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return Response.json({ ok:false, error:"bad request" }, { status:400 });
  }

  // หาเลขที่มีอยู่แล้ว
  const placeholders = numbers.map(()=>"?").join(",");
  const existRows = await query(
    `SELECT name FROM tables WHERE name IN (${placeholders})`,
    numbers.map(n => String(n))
  );
  const exist = new Set(existRows.map(r => r.name));

  const toInsert = numbers.filter(n => !exist.has(String(n)));
  const duplicates = numbers.filter(n => exist.has(String(n)));

  // แทรกชุดที่ไม่ซ้ำ
  if (toInsert.length) {
    // สร้าง code ทีละตัว
    const [{ maxid } = { maxid: 0 }] = await query(`SELECT COALESCE(MAX(id),0) AS maxid FROM tables`);
    let nextId = maxid;
    const values = toInsert.map(n => {
      nextId += 1;
      const code = "T" + String(nextId).padStart(6, "0");
      return [String(n), code];
    });

    // insert แบบหลายแถว
    const placeholders2 = values.map(()=>"(?, ?, 1, NOW())").join(",");
    const flat = values.flat();
    await query(
      `INSERT INTO tables (name, code, active, created_at) VALUES ${placeholders2}`,
      flat
    );
  }

  return Response.json({ ok:true, created: toInsert.length, duplicates });
}
