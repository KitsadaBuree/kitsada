// src/app/api/about/route.js
import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { verifyAuthToken } from "../../../../lib/auth";

export const runtime = "nodejs";

function getToken(req) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  if (m?.[1]) return m[1];

  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();

  return null;
}

export async function GET(req) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token); // { uid, ... }

    const rows = await query(
      "SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1",
      [payload.uid]
    );
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const user = rows[0];
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
}
