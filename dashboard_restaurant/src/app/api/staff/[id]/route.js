import { query } from "../../../../../lib/db";
import bcrypt from "bcryptjs";
export const runtime = "nodejs";

// PUT /api/staff/:id
export async function PUT(req, ctx) {
  const { id } = await ctx.params;                 // Next 15 ต้อง await
  const uid = Number(id);
  if (!uid) return Response.json({ ok:false, error:"ไม่พบไอดี" }, { status:400 });

  const body = await req.json().catch(()=>({}));
  const name  = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const phone = String(body?.phone || "").trim();
  const role  = String(body?.role || "").trim().toLowerCase();
  const password = String(body?.password || "").trim();

  if (!name)  return Response.json({ ok:false, error:"กรุณากรอกชื่อ-นามสกุล" }, { status:400 });
  if (!email) return Response.json({ ok:false, error:"กรุณากรอกอีเมล" }, { status:400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return Response.json({ ok:false, error:"รูปแบบอีเมลไม่ถูกต้อง" }, { status:400 });
  if (phone && !/^\d{8,15}$/.test(phone))
    return Response.json({ ok:false, error:"กรุณากรอกเบอร์ 8–15 หลัก" }, { status:400 });
  if (role && !["member","kitchen","manager","employee"].includes(role))
    return Response.json({ ok:false, error:"บทบาทไม่ถูกต้อง" }, { status:400 });

  const exist = await query(`SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1`, [email, uid]);
  if (exist.length) return Response.json({ ok:false, error:"อีเมลนี้ถูกใช้แล้ว" }, { status:409 });

  const set = ["name = ?","email = ?","phone = ?"];
  const args = [name, email, phone || null];

  if (role) { set.push("role = ?"); args.push(role); }

  if (password) {
    const password_hash = await bcrypt.hash(password, 10); // ✅ hash เมื่อมีรหัสใหม่
    set.push("password_hash = ?");
    args.push(password_hash);
  }

  args.push(uid);
  await query(`UPDATE users SET ${set.join(", ")} WHERE id = ?`, args);
  return Response.json({ ok:true });
}

// DELETE /api/staff/:id (ของเดิม ใช้ await ctx.params เช่นกัน)
export async function DELETE(req, ctx) {
  const { id } = await ctx.params;
  const uid = Number(id);
  if (!uid) return Response.json({ ok:false, error:"ไม่พบไอดี" }, { status:400 });

  await query(`DELETE FROM employees WHERE user_id = ?`, [uid]);
  await query(`DELETE FROM users WHERE id = ?`, [uid]);
  return Response.json({ ok:true });
}
