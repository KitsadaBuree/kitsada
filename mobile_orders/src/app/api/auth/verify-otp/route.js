import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import crypto from "crypto";

function makeResetToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const uid  = String(body?.uid || "");
    const code = String(body?.code || "").trim();

    if (!uid || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok:false, error:"invalid_input" }, { status:400 });
    }

    // ให้ DB คัดแถวที่ "ยังไม่ใช้ + ยังไม่หมดอายุ" มาเลย เพื่อตัดปัญหา timezone
    const rows = await query(
      `SELECT id, user_id, code, attempts
         FROM otp_codes
        WHERE uid=? AND used=0 AND expires_at > NOW()
        ORDER BY id DESC
        LIMIT 1`,
      [uid]
    );

    if (!rows.length) {
      // อาจจะหมดอายุหรือไม่พบ
      // เช็คเพิ่มเติมว่ามีแถว uid นี้ไหมเพื่อส่ง error ที่สื่อความหมาย
      const any = await query(`SELECT id FROM otp_codes WHERE uid=? LIMIT 1`, [uid]);
      return NextResponse.json(
        { ok:false, error: any.length ? "otp_expired" : "otp_not_found" },
        { status:400 }
      );
    }

    const rec = rows[0];

    // ล็อกถ้ากดผิดเกิน 5 ครั้ง
    if (Number(rec.attempts) >= 5) {
      return NextResponse.json({ ok:false, error:"otp_locked" }, { status:400 });
    }

    if (String(rec.code) !== code) {
      await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id=?`, [rec.id]);
      return NextResponse.json({ ok:false, error:"otp_wrong" }, { status:400 });
    }

    // ถูกต้อง -> ออก reset token และปิดการใช้งาน OTP นี้
    const token = makeResetToken();
    await query(
      `UPDATE otp_codes
          SET used=1, reset_token=?, reset_expires_at=DATE_ADD(NOW(), INTERVAL 15 MINUTE)
        WHERE id=?`,
      [token, rec.id]
    );

    return NextResponse.json({
      ok:true,
      data:{ user_id: rec.user_id, reset_token: token }
    });
  } catch (e) {
    return NextResponse.json({ ok:false, error: e.message || "server_error" }, { status:500 });
  }
}
