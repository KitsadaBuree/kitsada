import { query } from "../../../../lib/db";
export const runtime = "nodejs";

// ===== GET  /api/foods?q=&cat=&page=&pageSize= =====
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();         // ค้นทั้งชื่อเมนู/ชื่อหมวด
    const cat = (searchParams.get("cat") || "").trim();     // รับได้ทั้ง id หรือ ชื่อหมวด
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") || 20)));
    const offset = (page - 1) * pageSize;

    const where = [];
    const params = [];

    if (q) {
      where.push("(p.name LIKE ? OR c.name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (cat) {
      const n = Number(cat);
      if (!Number.isNaN(n) && String(n) === cat) { // เป็น id
        where.push("p.category_id = ?");
        params.push(n);
      } else {                                     // เป็นชื่อหมวด
        where.push("c.name = ?");
        params.push(cat);
      }
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ลองใช้ตาราง categories ก่อน ถ้าไม่มี ค่อย fallback เป็น product_categories
    const baseSql = `
      SELECT
        p.id, p.name, p.price, p.imageUrl,
        p.category_id,
        c.name AS category
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;

    let items;
    try {
      items = await query(baseSql, [...params, pageSize, offset]);
    } catch {
      const fallback = baseSql.replaceAll(" categories ", " product_categories ");
      items = await query(fallback, [...params, pageSize, offset]);
    }

    const countSql = `
      SELECT COUNT(*) AS c
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereSql}
    `;
    let countRows;
    try { countRows = await query(countSql, params); }
    catch {
      const fallback = countSql.replaceAll(" categories ", " product_categories ");
      countRows = await query(fallback, params);
    }

    return Response.json({
      ok: true,
      items,
      total: countRows[0]?.c || 0,
      page, pageSize,
    });
  } catch (err) {
    console.error("GET /api/foods error:", err);
    return Response.json({ ok:false, error: err.message }, { status: 500 });
  }
}


// ===== POST  /api/foods =====
export async function POST(req) {
  const MAX_PRICE = 99_999_999.99;

  const humanizeDbError = (e) => {
    const msg = String(e?.message || "");
    if (msg.includes("Out of range value for column 'price'")) {
      return `ราคาสูงเกินไป (สูงสุด ${MAX_PRICE.toLocaleString("th-TH")})`;
    }
    if (e?.code === "ER_DUP_ENTRY") {
      return "มีเมนูนี้อยู่แล้ว";
    }
    return "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
  };

  try {
    const b = await req.json();

    const name = String(b.name || "").trim();
    const rawPrice = String(b.price ?? "").replace(/[, ]/g, "");
    const nPrice = Number(rawPrice);
    const imageUrl = b.image_url ?? b.imageUrl ?? null; // รองรับสองชื่อคอลัมน์
    const category_id = b.category_id == null ? null : Number(b.category_id);

    // validate พื้นฐาน
    if (!name) return Response.json({ ok:false, error:"กรุณากรอกชื่อเมนู" }, { status:422 });
    if (!Number.isFinite(nPrice)) return Response.json({ ok:false, error:"กรุณากรอกราคาเป็นตัวเลข" }, { status:422 });
    if (nPrice < 0) return Response.json({ ok:false, error:"ราคาต้องไม่ติดลบ" }, { status:422 });
    if (nPrice > MAX_PRICE) {
      return Response.json({ ok:false, error:`ราคาสูงเกินไป (สูงสุด ${MAX_PRICE.toLocaleString("th-TH")})` }, { status:422 });
    }

    const price = Math.round(nPrice * 100) / 100;

    // ====== กันซ้ำชั้น API (ไม่สนตัวพิมพ์/ช่องว่าง) ======
    // นับว่า "ชื่อ + หมวด" คือคีย์ซ้ำ (ถ้าอยากกันซ้ำเฉพาะชื่อ ให้ตัดเงื่อนไข category ออก)
    const dup = await query(
      `SELECT p.id
         FROM products p
        WHERE TRIM(LOWER(p.name)) = TRIM(LOWER(?))
          AND (
            (p.category_id IS NULL AND ? IS NULL) OR p.category_id = ?
          )
        LIMIT 1`,
      [name, category_id, category_id]
    );
    if (dup.length) {
      return Response.json({ ok:false, error:"มีเมนูนี้อยู่แล้ว" }, { status:409 });
    }

    // ====== บันทึก (ลอง imageUrl ก่อน ถ้า schema ใช้ image_url จะ fallback) ======
    try {
      const r = await query(
        `INSERT INTO products (name, price, imageUrl, category_id) VALUES (?, ?, ?, ?)`,
        [name, price, imageUrl, category_id]
      );
      return Response.json({ ok:true, id:r.insertId });
    } catch (e) {
      if (String(e?.message || "").includes("Unknown column 'imageUrl'")) {
        const r = await query(
          `INSERT INTO products (name, price, image_url, category_id) VALUES (?, ?, ?, ?)`,
          [name, price, imageUrl, category_id]
        );
        return Response.json({ ok:true, id:r.insertId });
      }
      return Response.json({ ok:false, error:humanizeDbError(e) }, { status:400 });
    }
  } catch (err) {
    console.error("POST /api/foods error:", err);
    return Response.json({ ok:false, error:"เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status:500 });
  }
}


