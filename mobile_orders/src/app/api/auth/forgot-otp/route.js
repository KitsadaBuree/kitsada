// src/app/api/auth/forgot-otp/route.js
import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import crypto from "crypto";
import { sendOtpEmail } from "../../../../../lib/mailer";

export const runtime = "nodejs";

function maskEmail(email = "") {
  const [a, b = ""] = String(email).split("@");
  if (!a) return email;
  if (a.length <= 2) return `**@${b}`;
  return `${a.slice(0, 2)}***@${b}`;
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    const { email = "" } = await req.json().catch(() => ({}));
    const normalized = String(email).trim().toLowerCase();

    if (!normalized || !emailRe.test(normalized)) {
      return NextResponse.json({ ok: false, error: "missing_or_invalid_email" }, { status: 400 });
    }

    // หา user ด้วยอีเมล (แนะนำให้คอลัมน์ email มี index/unique)
    const [user] = await query(
      `SELECT id, email FROM users WHERE LOWER(email)=? LIMIT 1`,
      [normalized]
    );

    // เพื่อความปลอดภัย ตอบ ok เสมอ
    if (!user) {
      return NextResponse.json({ ok: true, uid: null, channel: "email", dest: "" }, { status: 200 });
    }

    // กันสแปมเบื้องต้น: ถ้าเพิ่งออก OTP ใน 60 วินาทีที่ผ่านมา ให้ตอบ ok แต่ไม่ออกใหม่
    const recent = await query(
      `SELECT id FROM otp_codes 
        WHERE user_id=? AND channel='email' AND created_at > (NOW() - INTERVAL 60 SECOND)
        ORDER BY id DESC LIMIT 1`,
      [user.id]
    );
    if (recent.length) {
      return NextResponse.json({
        ok: true,
        uid: null,
        channel: "email",
        dest: maskEmail(user.email),
      });
    }

    // ปิด OTP เก่าที่ยังไม่ใช้ (ป้องกันหลายอันค้าง)
    await query(
      `UPDATE otp_codes 
         SET used=1, reset_expires_at=NOW(), reset_token=NULL
       WHERE user_id=? AND channel='email' AND used=0`,
      [user.id]
    );

    // สร้าง/บันทึก OTP ใหม่
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 หลัก
    const uid = crypto.randomBytes(16).toString("hex");

    await query(
      `INSERT INTO otp_codes (uid, user_id, code, channel, dest, attempts, used, expires_at, created_at)
       VALUES (?, ?, ?, 'email', ?, 0, 0, (NOW() + INTERVAL 5 MINUTE), NOW())`,
      [uid, user.id, code, user.email]
    );

    // ส่งอีเมลจริง (ถ้าล้มเหลว ก็ยังตอบ ok เพื่อไม่เปิดเผยสถานะระบบ)
    try {
      await sendOtpEmail({ to: user.email, code, uid });
    } catch (err) {
      console.error("[sendOtpEmail] failed:", err);
    }

    // ❗️โปรดหลีกเลี่ยงการ console.log โค้ด OTP บนโปรดักชัน
    // console.log(`[OTP] uid=${uid} user=${user.id} code=${code}`);

    return NextResponse.json({
      ok: true,
      uid,
      channel: "email",
      dest: maskEmail(user.email),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "server_error" }, { status: 500 });
  }
}
