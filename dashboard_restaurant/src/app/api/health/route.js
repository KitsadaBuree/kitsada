import { query } from "../../../../lib/db";
export const runtime = "nodejs"; // ให้รันบน Node (ไม่ใช่ Edge)

export async function GET() {
  try {
    const rows = await query("SELECT 1 AS ok");
    // ลองเชื่อมตารางจริง
    const tables = await query("SHOW TABLES");
    return Response.json({ db: "ok", ping: rows[0].ok, tables });
  } catch (e) {
    console.error(e);
    return new Response(e.message || "DB error", { status: 500 });
  }
}
