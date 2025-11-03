// src/lib/mailer.js
import nodemailer from "nodemailer";

let _transporter;
let _verified = false;

/** สร้าง/คืน nodemailer transporter แบบ singleton */
function getTransporter() {
  if (_transporter) return _transporter;

  // ค่าเริ่มต้นที่ “พร้อมใช้กับ Gmail + App Password”
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.FROM_EMAIL; // กันพลาด
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[mailer] SMTP env not set; fallback to console.log");
    _transporter = null;
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user, pass },
  });

  return _transporter;
}

/** เรียกครั้งแรกจะ verify การเชื่อมต่อ ถ้าพลาดจะ log สาเหตุ */
async function ensureVerified(transporter) {
  if (!transporter || _verified) return;
  try {
    await transporter.verify();
    _verified = true;
    console.log("[mailer] SMTP verified");
  } catch (err) {
    // จับเคสยอดฮิตกับ Gmail ให้ชัดเจน
    if (err?.code === "EAUTH" || String(err?.response || "").includes("535-5.7.8")) {
      console.error(
        "[mailer] Gmail auth failed. ใช้รหัสผ่านธรรมดาไม่ได้ ต้องใช้ App Password:\n" +
          " - เปิด 2-Step Verification ใน Google Account\n" +
          " - สร้าง App password (16 ตัวอักษร ไม่มีเว้นวรรค)\n" +
          " - ตั้ง .env: SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=อีเมลเต็ม SMTP_PASS=AppPassword\n",
        err
      );
    } else {
      console.error("[mailer] SMTP verify failed:", err);
    }
  }
}

/** ส่งอีเมลทั่วไป */
export async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter();
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || "no-reply@example.com";
  const fromName = process.env.FROM_NAME || "OTP Service";

  if (!transporter) {
    // โหมด fallback: dev ไม่มี SMTP ก็แค่ log
    console.log("[MAIL:FALLBACK]", { to, subject, text });
    return { ok: true, fallback: true };
  }

  await ensureVerified(transporter);

  try {
    const info = await transporter.sendMail({
      from: { name: fromName, address: fromEmail },
      to,
      subject,
      text,
      html,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error("[mailer] sendMail error:", err);
    // โยนข้อความอ่านง่ายขึ้น
    if (err?.code === "EAUTH") {
      throw new Error("BadCredentials: ตรวจ SMTP_USER/SMTP_PASS (App Password) ให้ถูกต้อง");
    }
    throw err;
  }
}

/** เทมเพลตส่ง OTP */
export async function sendOtpEmail({ to, code, uid }) {
  const app = process.env.APP_NAME || "แอปของคุณ";
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";
  const verifyUrl = `${origin}/profile/reset/verify?uid=${encodeURIComponent(uid)}&channel=email&dest=${encodeURIComponent(to)}`;

  const subject = `[${app}] รหัส OTP ของคุณ`;
  const text = [
    `${app} - รหัส OTP ของคุณคือ ${code}`,
    ``,
    `รหัสมีอายุ 5 นาที และใช้ได้ครั้งเดียว`,
    `กดลิงก์ไปยังหน้ากรอกรหัส (ถ้าเปิดบนมือถือ):`,
    verifyUrl,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
      <h2 style="margin:0 0 8px 0">${app}</h2>
      <p>รหัส OTP ของคุณคือ</p>
      <div style="font-size:24px;font-weight:700;letter-spacing:2px;margin:12px 0">
        ${code}
      </div>
      <p>รหัสดังกล่าวมีอายุ <strong>5 นาที</strong> และใช้ได้ครั้งเดียว</p>
      <p>หรือกดลิงก์ไปยังหน้ากรอกรหัส:</p>
      <p><a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">${verifyUrl}</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
      <p style="color:#999;font-size:12px">ถ้าคุณไม่ได้ร้องขอ กรุณาเพิกเฉยอีเมลนี้</p>
    </div>
  `;

  return sendMail({ to, subject, text, html });
}
