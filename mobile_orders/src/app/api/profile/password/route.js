// src/app/api/profile/password/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "../../../../../lib/db";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, verifyToken } from "../../../../../lib/auth";

export const runtime = "nodejs";

async function getUserIdFromCookie() {
  const ck = await cookies();
  const token = ck.get(COOKIE_NAME)?.value || "";
  const payload = token ? verifyToken(token) : null;
  const id = Number(payload?.id);
  return Number.isFinite(id) ? id : null;
}

export async function POST(req) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { current_password = "", new_password = "" } = await req.json().catch(() => ({}));

  // อ่าน hash ปัจจุบัน
  const rows = await query("SELECT password_hash FROM users WHERE id=?", [userId]);
  if (!rows.length) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const ok = await bcrypt.compare(current_password, rows[0].password_hash || "");
  if (!ok) {
    return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 400 });
  }

  const hash = await bcrypt.hash(new_password, 10);
  await query("UPDATE users SET password_hash=? WHERE id=?", [hash, userId]);

  return NextResponse.json({ ok: true }, { status: 200 });
}
