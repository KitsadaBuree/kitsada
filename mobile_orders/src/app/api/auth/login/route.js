import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import { signAuthToken, buildAuthCookie } from "../../../../../lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const rows = await query(
      "SELECT id, name, email, password_hash, role, points FROM users WHERE email=? LIMIT 1",
      [email]
    );
    const u = rows[0];
    if (!u) return NextResponse.json({ ok:false, error:"INVALID_CREDENTIALS" }, { status:401 });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return NextResponse.json({ ok:false, error:"INVALID_CREDENTIALS" }, { status:401 });

    const token = signAuthToken({ id: u.id, email: u.email, name: u.name, role: u.role });
    const res = NextResponse.json({ ok:true });
    res.headers.append("Set-Cookie", buildAuthCookie(token));
    return res;
  } catch (e) {
    return NextResponse.json({ ok:false, error:e.message || "LOGIN_FAILED" }, { status:500 });
  }
}
