// src/app/api/staff/route.js
import { query } from "../../../../lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

// ---- helpers ----
function buildSort(sp) {
  // รับ ?sort=id:desc (ค่า default id:desc)
  const raw = (sp.get("sort") || "id:desc").trim().toLowerCase();
  const [k = "id", d = "desc"] = raw.split(":");
  // whitelist เฉพาะคอลัมน์ที่อนุญาต
  const key = ["id","name","email","phone","role","created_at"].includes(k) ? k : "id";
  const dir = d === "asc" ? "ASC" : "DESC";
  const map = { id: "u.id", name: "u.name", email: "u.email", phone: "u.phone", role: "u.role", created_at: "u.created_at" };
  return `${map[key]} ${dir}`;
}

// ---- GET /api/staff ----
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "").trim().toLowerCase(); // '', member, kitchen, manager, employee
  const q = (searchParams.get("q") || "").trim();

  // ทำให้เป็นเลขปลอดภัย แล้วอินไลน์ลง SQL (หลีกเลี่ยง LIMIT ? OFFSET ?)
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 10)));
  const offset = (page - 1) * pageSize;
  const LIMIT_SQL = String(parseInt(pageSize, 10));
  const OFFSET_SQL = String(parseInt(offset, 10));

  const orderBy = buildSort(searchParams);

  const where = [];
  const args = [];

  // แสดงเฉพาะ role ที่เป็นพนักงาน
  where.push("u.role IN ('manager','kitchen','member','employee')");
  if (role) { where.push("u.role = ?"); args.push(role); }

  if (q) {
    where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR e.employee_code LIKE ?)");
    const like = `%${q}%`;
    args.push(like, like, like, like);
  }
  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // รายการ (อินไลน์ LIMIT/OFFSET)
  const listSql = `
    SELECT
      u.id, u.name, u.email, u.phone, u.role, u.created_at,
      e.employee_code, e.hire_date, e.status
    FROM users u
    LEFT JOIN employees e ON e.user_id = u.id
    ${whereSQL}
    ORDER BY ${orderBy}
    LIMIT ${LIMIT_SQL} OFFSET ${OFFSET_SQL}
  `;
  const rows = await query(listSql, args);

  // นับรวม
  const countSql = `
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN employees e ON e.user_id = u.id
    ${whereSQL}
  `;
  const [{ total } = { total: 0 }] = await query(countSql, args);

  return Response.json({
    ok: true,
    data: rows,
    page,
    pageSize,
    total,
    pageCount: Math.ceil(total / pageSize),
  });
}

// ---- POST /api/staff ----
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name  = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const phone = String(body?.phone || "").trim();
  const role  = String(body?.role || "employee").trim().toLowerCase();
  const password = String(body?.password || "").trim();

  if (!name)  return Response.json({ ok:false, error:"กรุณากรอกชื่อ-นามสกุล" }, { status:400 });
  if (!email) return Response.json({ ok:false, error:"กรุณากรอกอีเมล" }, { status:400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return Response.json({ ok:false, error:"รูปแบบอีเมลไม่ถูกต้อง" }, { status:400 });
  if (phone && !/^\d{8,15}$/.test(phone))
    return Response.json({ ok:false, error:"กรุณากรอกเบอร์ 8–15 หลัก" }, { status:400 });
  if (!["member","kitchen","manager","employee"].includes(role))
    return Response.json({ ok:false, error:"บทบาทไม่ถูกต้อง" }, { status:400 });
  if (!password)
    return Response.json({ ok:false, error:"กรุณากรอกรหัสผ่าน" }, { status:400 });

  // กันซ้ำอีเมล
  const dupe = await query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  if (dupe.length) return Response.json({ ok:false, error:"อีเมลนี้ถูกใช้แล้ว" }, { status:409 });

  const password_hash = await bcrypt.hash(password, 10);

  await query(
    `INSERT INTO users (name, email, phone, role, password_hash, created_at)
     VALUES (?,?,?,?,?, NOW())`,
    [name, email, phone || null, role, password_hash]
  );

  return Response.json({ ok:true });
}
