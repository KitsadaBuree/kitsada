// src/app/api/_mail-test/route.js
import { NextResponse } from "next/server";
import { sendMail } from "../../../../lib/mailer";

export async function GET() {
  try {
    const r = await sendMail({
      to: process.env.SMTP_USER,
      subject: "Test Gmail SMTP",
      text: "Hello from Nodemailer via Gmail App Password",
    });
    return NextResponse.json({ ok: true, r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
