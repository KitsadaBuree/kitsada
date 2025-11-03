import { query } from "../../../../lib/db";
export const runtime = "nodejs";

// cache
let CATEGORY_TABLE = null;
let IMAGE_COL = null;

async function resolveCategoryTable() {
  if (CATEGORY_TABLE) return CATEGORY_TABLE;
  const r = await query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name IN ('categories','product_categories')
     ORDER BY (table_name='product_categories') DESC
     LIMIT 1`
  );
  CATEGORY_TABLE = r?.[0]?.table_name || "categories";
  return CATEGORY_TABLE;
}

async function resolveImageColumn() {
  if (IMAGE_COL) return IMAGE_COL;
  const r = await query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'products'
        AND column_name IN ('imageUrl','image_url')
      ORDER BY (column_name='imageUrl') DESC
      LIMIT 1`
  );
  IMAGE_COL = r?.[0]?.column_name || "imageUrl";
  return IMAGE_COL;
}

function numOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ===== GET =====
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q        = (searchParams.get("q")    || "").trim();
    const cat      = (searchParams.get("cat")  || "").trim();

    // ทำให้เป็นเลขปลอดภัย แล้วอินไลน์ลง SQL
    const page     = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") || 20)));
    const offset   = (page - 1) * pageSize;
    const LIMIT_SQL  = String(parseInt(pageSize, 10)); // ปลอดภัยเพราะเราควบคุมช่วง
    const OFFSET_SQL = String(parseInt(offset, 10));

    const categoryTable = await resolveCategoryTable();
    const imageCol = await resolveImageColumn();

    const where = [];
    const params = [];

    if (q) {
      where.push("(p.name LIKE ? OR c.name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (cat) {
      const id = numOrNull(cat);
      if (id !== null && String(id) === cat) {
        where.push("p.category_id = ?");
        params.push(id);
      } else {
        where.push("(c.name = ? OR IFNULL(c.slug, '') = ?)");
        params.push(cat, cat);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const listSql = `
      SELECT
        p.id, p.name, p.price,
        p.${imageCol} AS imageUrl,
        p.category_id,
        COALESCE(c.name, '(ไม่ระบุหมวด)') AS category
      FROM products p
      LEFT JOIN ${categoryTable} c ON c.id = p.category_id
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT ${LIMIT_SQL} OFFSET ${OFFSET_SQL}`; // ← อินไลน์ ไม่ใช้ ?
    const items = await query(listSql, params);

    const countSql = `
      SELECT COUNT(*) AS c
      FROM products p
      LEFT JOIN ${categoryTable} c ON c.id = p.category_id
      ${whereSql}`;
    const [{ c: total = 0 } = {}] = await query(countSql, params);

    return Response.json({
      ok: true,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("GET /api/foods error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ===== POST =====
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
    const image = b.image_url ?? b.imageUrl ?? null;
    const category_id = b.category_id == null ? null : Number(b.category_id);

    if (!name)  return Response.json({ ok: false, error: "กรุณากรอกชื่อเมนู" }, { status: 422 });
    if (!Number.isFinite(nPrice)) return Response.json({ ok: false, error: "กรุณากรอกราคาเป็นตัวเลข" }, { status: 422 });
    if (nPrice < 0) return Response.json({ ok: false, error: "ราคาต้องไม่ติดลบ" }, { status: 422 });
    if (nPrice > MAX_PRICE) {
      return Response.json({ ok: false, error: `ราคาสูงเกินไป (สูงสุด ${MAX_PRICE.toLocaleString("th-TH")})` }, { status: 422 });
    }

    const price = Math.round(nPrice * 100) / 100;

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
      return Response.json({ ok: false, error: "มีเมนูนี้อยู่แล้ว" }, { status: 409 });
    }

    try {
      const r = await query(
        `INSERT INTO products (name, price, imageUrl, category_id)
         VALUES (?, ?, ?, ?)`,
        [name, price, image, category_id]
      );
      return Response.json({ ok: true, id: r.insertId });
    } catch (e) {
      if (String(e?.message || "").includes("Unknown column 'imageUrl'")) {
        const r = await query(
          `INSERT INTO products (name, price, image_url, category_id)
           VALUES (?, ?, ?, ?)`,
          [name, price, image, category_id]
        );
        return Response.json({ ok: true, id: r.insertId });
      }
      return Response.json({ ok: false, error: humanizeDbError(e) }, { status: 400 });
    }
  } catch (err) {
    console.error("POST /api/foods error:", err);
    return Response.json({ ok: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}
