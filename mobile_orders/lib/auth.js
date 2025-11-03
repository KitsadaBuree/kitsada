// lib/auth.js
import jwt from "jsonwebtoken";

export const COOKIE_NAME = "auth_token";
const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 วัน

export function signAuthToken(payload) {
  // ✅ ใช้ expiresIn ให้ถูกต้อง
  return jwt.sign(payload, SECRET, { expiresIn: MAX_AGE });
}

export function buildAuthCookie(token) {
  const isProd = process.env.NODE_ENV === "production";
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE}`,
    isProd ? "Secure" : null,
  ].filter(Boolean).join("; ");
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}
