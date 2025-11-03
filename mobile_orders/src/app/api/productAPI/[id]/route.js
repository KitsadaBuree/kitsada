// src/app/api/productAPI/[id]/route.js
import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
export const runtime = "nodejs";

export async function GET(req, ctx) {
  const { id } = await ctx.params;           // ✅ Next 15: ต้อง await
  const num = Number(id);

  if (!Number.isInteger(num) || num <= 0) {
    return NextResponse.json({ ok:false, error:"Invalid id" }, { status:400 });
  }

  try {
    const rows = await query(
      `SELECT 
         id, name, price, imageUrl, 
         category_id AS categoryId, 
         created_at  AS createdAt,
         cost
       FROM products WHERE id=? LIMIT 1`,
      [num]
    );

    if (!rows.length) {
      return NextResponse.json({ ok:false, error:"Not found" }, { status:404 });
    }

    const row = rows[0];
    row.price = Number(row.price ?? 0);
    row.cost  = Number(row.cost  ?? 0);

    return NextResponse.json({ ok:true, data: row }, { status:200 });
  } catch (e) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
