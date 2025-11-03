import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "../../../../../lib/auth";

export async function GET() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ ok:false, error:"UNAUTHORIZED" }, { status:401 });
  return NextResponse.json({ ok:true, user: payload });
}
