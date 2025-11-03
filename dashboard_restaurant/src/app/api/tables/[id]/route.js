// src/app/api/tables/[id]/route.js
import { query } from "../../../../../lib/db";
export const runtime = "nodejs";

export async function GET(req, ctx) {
  const { id } = await ctx.params;
  const rows = await query(`SELECT id, code, name, active, created_at FROM tables WHERE id=? LIMIT 1`, [id]);
  if (!rows.length) return Response.json({ ok:false, error:"ไม่พบรายการ" }, { status:404 });
  return Response.json({ ok:true, data: rows[0] });
}

export async function PUT(req, ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const code = body.code !== undefined ? String(body.code).trim() : undefined;
  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const active = body.active !== undefined ? (Number(body.active) ? 1 : 0) : undefined;

  // ตรวจ code ซ้ำเมื่อมีการเปลี่ยน
  if (code) {
    const dupe = await query(`SELECT id FROM tables WHERE code=? AND id<>? LIMIT 1`, [code, id]);
    if (dupe.length) return Response.json({ ok:false, error:"code นี้ถูกใช้แล้ว" }, { status:409 });
  }

  const sets = [];
  const args = [];
  if (code !== undefined)  { sets.push("code=?");   args.push(code); }
  if (name !== undefined)  { sets.push("name=?");   args.push(name || null); }
  if (active !== undefined){ sets.push("active=?"); args.push(active); }

  if (!sets.length) return Response.json({ ok:false, error:"ไม่มีข้อมูลแก้ไข" }, { status:400 });

  await query(`UPDATE tables SET ${sets.join(", ")} WHERE id=?`, [...args, id]);
  return Response.json({ ok:true });
}

export async function DELETE(req, ctx) {
  const { id } = await ctx.params;
  await query(`DELETE FROM tables WHERE id=?`, [id]);
  return Response.json({ ok:true });
}
