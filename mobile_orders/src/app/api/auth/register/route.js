// src/app/api/auth/register/route.js
import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import bcrypt from "bcryptjs";
import { signAuthToken, buildAuthCookie } from "../../../../../lib/auth";

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim() || null;
    const rawEmail = String(body.email ?? "");
    const email = rawEmail.trim().toLowerCase(); // normalize
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "WEAK_PASSWORD" }, { status: 400 });
    }

    // เช็คซ้ำเชิงประสบการณ์ผู้ใช้ (ไม่ใช่ตัวกันชนหลัก)
    const dup = await query("SELECT id FROM users WHERE email=? LIMIT 1", [email]);
    if (dup.length) {
      return NextResponse.json({ ok: false, error: "EMAIL_IN_USE" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const now = new Date();

    // กันชนหลักอยู่ที่ UNIQUE INDEX + try/catch ด้านล่าง
    let result;
    try {
      result = await query(
        "INSERT INTO users (name, email, phone, password_hash, role, points, created_at) VALUES (?, ?, ?, ?, 'member', 0, ?)",
        [name, email, phone, hash, now]
      );
    } catch (e) {
      // รองรับกรณี race condition แล้วชน UNIQUE KEY
      if (e?.code === "ER_DUP_ENTRY") {
        return NextResponse.json({ ok: false, error: "EMAIL_IN_USE" }, { status: 409 });
      }
      throw e;
    }

    const id = result.insertId;

    // ล็อกอินอัตโนมัติ (ถ้าอยากบังคับ verify อีเมล ให้ตัดส่วนนี้ออกแล้วส่งอีเมลแทน)
    const token = signAuthToken({ id, email, name, role: "member" });
    const res = NextResponse.json({ ok: true, id });
    res.headers.append("Set-Cookie", buildAuthCookie(token));
    return res;
  } catch (e) {
    console.error("REGISTER_ERROR:", e);
    return NextResponse.json({ ok: false, error: "REGISTER_FAILED" }, { status: 500 });
  }
}
