// src/app/api/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../../lib/db";
import { signAuthToken } from "../../../../lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();

  const rows = await query(
    "SELECT id, name, email, phone, password_hash, role FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const user = rows?.[0];
  if (!user) return NextResponse.json({ ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });

  const token = await signAuthToken({
    uid: user.id,
    name: user.name,
    email: user.email,
    role: user.role,                 // สำคัญ
  });

  // ปลายทางตามบทบาท
  let next = "/login?error=forbidden";
  if (user.role === "kitchen") next = "/kitchen/orders";
  else if (user.role === "manager" || user.role === "employee") next = "/dashboard/reports";
  // member => forbidden

  const res = NextResponse.json({ ok: true, next });
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 ชม.
  });
  return res;
}
