// src/middleware.js
import { NextResponse } from "next/server";
import { verifyAuthToken } from "./lib/auth";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;

  // ข้ามไฟล์สาธารณะ/_next
  const PUBLIC_FILE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json|map|css|js|woff2?|ttf|otf|eot|mp4|webm|pdf)$/i;
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    ["/favicon.ico","/robots.txt","/sitemap.xml"].includes(pathname) ||
    PUBLIC_FILE.test(pathname);
  if (isStatic) return NextResponse.next();

  // โฮมของแต่ละ root
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard/reports", req.url));
  }
  if (pathname === "/kitchen") {
    return NextResponse.redirect(new URL("/kitchen/orders", req.url));
  }

  // หน้า login: ถ้ามี token แล้ว ให้เด้งตามบทบาท
  if (pathname.startsWith("/login")) {
    if (!token) return NextResponse.next();
    try {
      const { role } = await verifyAuthToken(token);
      if (role === "kitchen") return NextResponse.redirect(new URL("/kitchen/orders", req.url));
      if (role === "manager" || role === "employee")
        return NextResponse.redirect(new URL("/dashboard/reports", req.url));
      return NextResponse.redirect(new URL("/login?error=forbidden", req.url)); // member
    } catch {
      return NextResponse.next();
    }
  }

  // เส้นทางที่ต้องล็อกอิน
  const inDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const inKitchen   = pathname === "/kitchen"   || pathname.startsWith("/kitchen/");

  if (inDashboard || inKitchen) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    try {
      const { role } = await verifyAuthToken(token);

      // dashboard: อนุญาตเฉพาะ manager + employee
      if (inDashboard && !(role === "manager" || role === "employee")) {
        if (role === "kitchen") return NextResponse.redirect(new URL("/kitchen/orders", req.url));
        return NextResponse.redirect(new URL("/login?error=forbidden", req.url)); // member
      }

      // kitchen: อนุญาตเฉพาะ kitchen
      if (inKitchen && role !== "kitchen") {
        if (role === "manager" || role === "employee")
          return NextResponse.redirect(new URL("/dashboard/reports", req.url));
        return NextResponse.redirect(new URL("/login?error=forbidden", req.url)); // member
      }

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // อื่น ๆ: ถ้ามี token ส่งเข้าหน้าหลักตามบทบาท
  if (token) {
    try {
      const { role } = await verifyAuthToken(token);
      if (role === "kitchen") return NextResponse.redirect(new URL("/kitchen/orders", req.url));
      if (role === "manager" || role === "employee")
        return NextResponse.redirect(new URL("/dashboard/reports", req.url));
      return NextResponse.redirect(new URL("/login?error=forbidden", req.url));
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json|map|css|js|woff2?|ttf|otf|eot|mp4|webm|pdf)$).*)",
  ],
};
