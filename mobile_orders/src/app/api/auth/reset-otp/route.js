// src/app/api/auth/reset-otp/route.js
import { NextResponse } from "next/server";
import { query, getConnection } from "../../../../../lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { reset_token = "", new_password = "" } = await req.json().catch(() => ({}));

    // validate เบื้องต้น
    if (!reset_token || !new_password) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
    }
    if (new_password.length < 6) {
      return NextResponse.json({ ok: false, error: "password_too_short" }, { status: 400 });
    }

    // ดึง OTP ที่ยืนยันแล้ว และ token ยังไม่หมดอายุ (เช็คใน DB ป้องกัน timezone เพี้ยน)
    const rows = await query(
      `SELECT id, user_id
         FROM otp_codes
        WHERE reset_token = ?
          AND used = 1
          AND reset_expires_at > NOW()
        ORDER BY id DESC
        LIMIT 1`,
      [reset_token]
    );
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "invalid_or_expired_token" }, { status: 400 });
    }
    const otp = rows[0];

    const hash = await bcrypt.hash(String(new_password), 10);

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      // ✅ ใช้คอลัมน์ที่ถูกต้อง: password_hash
      await conn.execute(
        `UPDATE users SET password_hash=? WHERE id=?`,
        [hash, otp.user_id]
      );

      // ทำให้ token ใช้ซ้ำไม่ได้ และถือว่าหมดอายุไปเลย
      await conn.execute(
        `UPDATE otp_codes
            SET reset_expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY),
                reset_token = NULL
          WHERE id = ?`,
        [otp.id]
      );

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "server_error" }, { status: 500 });
  }
}
