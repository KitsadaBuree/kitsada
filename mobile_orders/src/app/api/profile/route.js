// src/app/api/profile/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "../../../../lib/db";
import { COOKIE_NAME, verifyToken } from "../../../../lib/auth";

export const runtime = "nodejs";

// ต้อง await cookies()
async function getUserIdFromCookie() {
  const ck = await cookies();
  const token = ck.get(COOKIE_NAME)?.value || "";
  const payload = token ? verifyToken(token) : null;
  const id = Number(payload?.id);
  return Number.isFinite(id) ? id : null;
}

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rows = await query(
    "SELECT id, email, name, phone, points FROM users WHERE id=? LIMIT 1",
    [userId]
  );
  if (!rows.length) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(
    { ok: true, profile: rows[0] },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(req) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { name = "", phone = "" } = await req.json().catch(() => ({}));

  // จำกัดเบอร์เป็นตัวเลขล้วน สูงสุด 10 หลัก
  const phoneSan = String(phone).replace(/\D/g, "").slice(0, 10);

  await query("UPDATE users SET name=?, phone=? WHERE id=?", [name, phoneSan, userId]);

  const rows = await query(
    "SELECT id, email, name, phone, points FROM users WHERE id=? LIMIT 1",
    [userId]
  );

  return NextResponse.json(
    { ok: true, profile: rows[0] },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
