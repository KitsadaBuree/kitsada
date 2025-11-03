export async function sendOtpEmail({ to, code }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV] Send OTP to email ${to}: ${code}`);
    return;
  }
  // ใช้ nodemailer เหมือน mailer เดิมของคุณก็ได้
}

export async function sendOtpSms({ to, code }) {
  // ต่อผู้ให้บริการ SMS ที่คุณใช้ (Twilio/ThaiBulkSMS ฯลฯ)
  // ใน dev:
  console.log(`[DEV] Send OTP SMS to ${to}: ${code}`);
}
