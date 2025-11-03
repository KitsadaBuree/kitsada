// src/app/api/orders/by-table/route.js
import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import crypto from "crypto";
export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const table = (searchParams.get("table_no") || searchParams.get("table") || "").trim();
    const limitNum  = Math.min(Math.max(Number(searchParams.get("limit")  || 30), 1), 100);
    const offsetNum = Math.max(0, Number(searchParams.get("offset") || 0));
    const LIMIT_SQL  = String(parseInt(limitNum, 10));
    const OFFSET_SQL = String(parseInt(offsetNum, 10));

    const includePaid   = searchParams.get("include_paid")   === "1";
    const includeClosed = searchParams.get("include_closed") === "1";
    if (!table) return NextResponse.json({ ok:false, error:"missing table_no" }, { status:400 });

    const where = ["o.table_no = ?"];
    const args  = [table];
    if (!includePaid)   where.push("o.payment_status = 'UNPAID'");
    if (!includeClosed) where.push("o.closed_at IS NULL");
    where.push("(o.status IS NULL OR o.status <> 'canceled')");
    const whereSql = `WHERE ${where.join(" AND ")}`;

    const sql = `
      SELECT
        o.id, o.order_code, o.table_no,
        o.items_count, o.subtotal, o.service_rate, o.service_charge,
        o.total, o.note, o.status, o.payment_status,
        o.created_at, o.closed_at
      FROM orders o
      ${whereSql}
      ORDER BY o.id DESC
      LIMIT ${LIMIT_SQL} OFFSET ${OFFSET_SQL}
    `;
    const rows = await query(sql, args);

    // สร้างสตริงสรุปสถานะที่สำคัญ แล้วทำแฮชเป็น ETag
    const fingerprint = rows
      .map(r => `${r.id}|${r.status}|${r.payment_status}|${r.closed_at ?? ""}`)
      .join(";");
    const etag = `"${crypto.createHash("sha1").update(fingerprint).digest("hex")}"`;

    // ถ้าคลายตรงกับ If-None-Match -> 304 ไม่ต้องส่งบอดี้
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    return NextResponse.json(
      { ok: true, data: rows },
      {
        status: 200,
        headers: {
          ETag: etag,
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
