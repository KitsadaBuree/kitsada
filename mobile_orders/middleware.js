// middleware.js  (วางไว้ที่รากโปรเจกต์ ไม่ใช่ใน src/)
import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // ใช้ตรงๆใน middleware (edge runtime)

// ชื่อคุกกี้ให้ตรงกับตอน login ที่ตั้งไว้ (ในตัวอย่างคือ "auth_token")
const COOKIE_NAME = "auth_token";

// เส้นทางที่อยากป้องกัน
const PROTECTED_PREFIX = "/dashboard";

export async function middleware(req) {
  const url = new URL(req.url);

  // ถ้าไม่ใช่เส้นทางที่ป้องกัน ปล่อยผ่าน
  if (!url.pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(
      new URL("/profile?next=" + encodeURIComponent(url.pathname), url)
    );
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");
    await jwtVerify(token, secret); // แค่ verify ได้ก็ผ่าน
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL("/profile?next=" + encodeURIComponent(url.pathname), url)
    );
  }
}

// ระบุ matcher ให้ตรงกับเส้นทางที่ต้องการป้องกัน
export const config = {
  matcher: ["/dashboard/:path*"],
};
