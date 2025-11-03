import { query } from "../../../../lib/db";

// GET /api/members?q=&page=1&pageSize=10
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 10)));
  const offset = (page - 1) * pageSize;

  const where = ["u.role = 'member'"]; // สมาชิก
  const args = [];
  if (q) {
    where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const whereSQL = `WHERE ${where.join(" AND ")}`;

  // ดึงสรุป: จำนวนออเดอร์/ยอดใช้จ่าย/ออเดอร์ล่าสุด + points ใน users
  const rows = await query(
    `
    SELECT
      u.id, u.name, u.email, u.phone, u.points, u.created_at,
      COUNT(o.id)            AS orders_count,
      COALESCE(SUM(o.total),0) AS spent_total,
      MAX(o.created_at)      AS last_order_at
    FROM users u
    LEFT JOIN orders o ON o.customer_id = u.id
    ${whereSQL}
    GROUP BY u.id
    ORDER BY u.id DESC
    LIMIT ? OFFSET ?
    `,
    [...args, pageSize, offset]
  );

  const [{ total } = { total: 0 }] = await query(
    `
    SELECT COUNT(*) AS total
    FROM users u
    ${whereSQL}
    `,
    args
  );

  return Response.json({
    ok: true,
    data: rows,
    page, pageSize, total,
    pageCount: Math.ceil(total / pageSize),
  });
}
