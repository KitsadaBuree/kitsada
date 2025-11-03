// src/app/api/foods/[id]/route.js
import { query } from "../../../../../lib/db";
export const runtime = "nodejs";

const MAX_PRICE = 99_999_999.99;

function humanizeDbError(e) {
  const msg = String(e?.message || "");
  if (e?.code === "ER_DUP_ENTRY") return "มีเมนูนี้อยู่แล้ว";
  if (msg.includes("Out of range value for column 'price'")) {
    return `ราคาสูงเกินไป (สูงสุด ${MAX_PRICE.toLocaleString("th-TH")})`;
  }
  if (msg.includes("Unknown column 'imageUrl'")) {
    return "โครงสร้างตารางไม่ตรง (imageUrl) — กำลังลองแบบ image_url ให้…";
  }
  return "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
}

/* ================= GET /api/foods/:id ================= */
export async function GET(_req, ctx) {
  try {
    const { id: idStr } = await ctx.params;   // ต้อง await
    const id = Number(idStr);
    if (!id) return Response.json({ ok:false, error:"invalid id" }, { status:400 });

    const sqlA = `
      SELECT p.id, p.name, p.price, p.imageUrl,
             p.category_id, c.name AS category
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = ? LIMIT 1
    `;
    try {
      const rows = await query(sqlA, [id]);
      return Response.json({ ok:true, item: rows[0] || null });
    } catch {
      try {
        const rows = await query(
          sqlA.replaceAll(" LEFT JOIN categories ", " LEFT JOIN product_categories "),
          [id]
        );
        return Response.json({ ok:true, item: rows[0] || null });
      } catch {
        const sqlB = `
          SELECT p.id, p.name, p.price, p.image_url AS imageUrl,
                 p.category_id, c.name AS category
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.id = ? LIMIT 1
        `;
        try {
          const rows = await query(sqlB, [id]);
          return Response.json({ ok:true, item: rows[0] || null });
        } catch {
          const rows = await query(
            sqlB.replaceAll(" LEFT JOIN categories ", " LEFT JOIN product_categories "),
            [id]
          );
          return Response.json({ ok:true, item: rows[0] || null });
        }
      }
    }
  } catch (err) {
    return Response.json({ ok:false, error: err.message }, { status:500 });
  }
}

/* ================= PUT /api/foods/:id ================= */
export async function PUT(req, ctx) {
  try {
    const { id: idStr } = await ctx.params;   // ต้อง await
    const id = Number(idStr);
    if (!id) return Response.json({ ok:false, error:"invalid id" }, { status:400 });

    const b = await req.json();
    const name = String(b.name || "").trim();
    const rawPrice = String(b.price ?? "").replace(/[, ]/g, "");
    const numPrice = Number(rawPrice);
    const category_id = b.category_id == null ? null : Number(b.category_id);
    const img = b.image_url ?? b.imageUrl ?? null;

    // validate
    if (!name) return Response.json({ ok:false, error:"กรุณากรอกชื่อเมนู" }, { status:422 });
    if (!Number.isFinite(numPrice)) return Response.json({ ok:false, error:"กรุณากรอกราคาเป็นตัวเลข" }, { status:422 });
    if (numPrice < 0) return Response.json({ ok:false, error:"ราคาต้องไม่ติดลบ" }, { status:422 });
    if (numPrice > MAX_PRICE)
      return Response.json({ ok:false, error:`ราคาสูงเกินไป (สูงสุด ${MAX_PRICE.toLocaleString("th-TH")})` }, { status:422 });
    const price = Math.round(numPrice * 100) / 100;

    // เช็กชื่อซ้ำ (ชื่อ+หมวด, ไม่สนตัวพิมพ์/ช่องว่าง) และยกเว้นแถวตัวเอง
    const dup = await query(
      `SELECT id
         FROM products
        WHERE TRIM(LOWER(name)) = TRIM(LOWER(?))
          AND ((category_id IS NULL AND ? IS NULL) OR category_id = ?)
          AND id <> ?
        LIMIT 1`,
      [name, category_id, category_id, id]
    );
    if (dup.length) {
      return Response.json({ ok:false, error:"มีเมนูนี้อยู่แล้ว" }, { status:409 });
    }

    // อัปเดต (ลอง imageUrl → fallback image_url)
    try {
      const r = await query(
        `UPDATE products SET name=?, price=?, imageUrl=?, category_id=? WHERE id=?`,
        [name, price, img, category_id, id]
      );
      if (!r.affectedRows) return Response.json({ ok:false, error:"ไม่พบรายการ" }, { status:404 });
      return Response.json({ ok:true });
    } catch (e) {
      if (String(e?.message || "").includes("Unknown column 'imageUrl'")) {
        const r2 = await query(
          `UPDATE products SET name=?, price=?, image_url=?, category_id=? WHERE id=?`,
          [name, price, img, category_id, id]
        );
        if (!r2.affectedRows) return Response.json({ ok:false, error:"ไม่พบรายการ" }, { status:404 });
        return Response.json({ ok:true });
      }
      if (e?.code === "ER_DUP_ENTRY") {
        return Response.json({ ok:false, error:"มีเมนูนี้อยู่แล้ว" }, { status:409 });
      }
      return Response.json({ ok:false, error: humanizeDbError(e) }, { status:400 });
    }
  } catch (err) {
    console.error("PUT /api/foods/:id", err);
    return Response.json({ ok:false, error:"เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status:500 });
  }
}

/* ================= DELETE /api/foods/:id ================= */
export async function DELETE(_req, ctx) {
  try {
    const { id: idStr } = await ctx.params;   // ต้อง await
    const id = Number(idStr);
    if (!id) return Response.json({ ok:false, error:"invalid id" }, { status:400 });

    await query(`DELETE FROM products WHERE id=?`, [id]);
    return Response.json({ ok:true });
  } catch (err) {
    return Response.json({ ok:false, error: err.message }, { status:500 });
  }
}
