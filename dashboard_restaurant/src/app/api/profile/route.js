import { query } from "../../../../lib/db";
import { verifyAuthToken } from "../../../../lib/auth";
import bcrypt from "bcryptjs";

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
    if (!token) return Response.json({ ok:false, error:"unauthorized" }, { status:401 });
    const payload = await verifyAuthToken(token);

    const [row] = await query(
      "SELECT id, name, email, phone, role FROM users WHERE id = ? LIMIT 1",
      [payload.uid]
    );
    if (!row) return Response.json({ ok:false, error:"not_found" }, { status:404 });

    return Response.json({ ok:true, user: row });
  } catch {
    return Response.json({ ok:false, error:"unauthorized" }, { status:401 });
  }
}

export async function PUT(req) {
  try {
    const token = getToken(req);
    if (!token) return Response.json({ ok:false, error:"unauthorized" }, { status:401 });
    const payload = await verifyAuthToken(token);

    const body = await req.json().catch(() => ({}));
    const name  = String(body?.name || "").trim();
    const phone = String(body?.phone || "").trim();
    const password = String(body?.password || "").trim();

    if (!name) return Response.json({ ok:false, error:"กรุณากรอกชื่อ" }, { status:400 });
    if (phone && !/^\d{10}$/.test(phone)) return Response.json({ ok:false, error:"เบอร์ไม่ถูกต้อง" }, { status:400 });

    const set = ["name = ?", "phone = ?"];
    const args = [name, phone || null];

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      set.push("password_hash = ?");
      args.push(hash);
    }

    args.push(payload.uid);
    await query(`UPDATE users SET ${set.join(", ")} WHERE id = ?`, args);

    return Response.json({ ok:true });
  } catch {
    return Response.json({ ok:false, error:"update_failed" }, { status:500 });
  }
}
