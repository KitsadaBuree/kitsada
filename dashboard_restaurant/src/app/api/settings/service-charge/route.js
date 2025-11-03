// src/app/api/settings/service-charge/route.js
import { query, execute } from "../../../../../lib/db";
export const runtime = "nodejs";

// GET => { rate }
export async function GET() {
  try {
    const rows = await query(`SELECT service_rate FROM settings LIMIT 1`);
    return Response.json({ ok: true, rate: Number(rows[0]?.service_rate ?? 0) });
  } catch (err) {
    console.error("GET /api/settings/service-charge error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// PUT body: { rate }
export async function PUT(req) {
  try {
    const b = await req.json();
    const rate = Math.max(0, Math.min(100, Number(b.rate || 0)));
    await execute(`UPDATE settings SET service_rate = ? WHERE id = 1`, [rate]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/settings/service-charge error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
