import { NextResponse } from "next/server";
import { query } from "../../../../lib/db"; // ปรับ path ให้ตรงโปรเจกต์

export const runtime = "nodejs";

export async function GET() {
  try {
    // สมมติมีแค่ 1 แถว
    const rows = await query("SELECT service_rate FROM settings LIMIT 1");
    const sr = rows?.[0]?.service_rate ?? 0;  // เช่น 4.50 (หน่วย: เปอร์เซ็นต์)
    // ส่งเป็นสัดส่วนทศนิยมให้ฝั่ง UI
    const rate = Number(sr) / 100;            // 4.50 -> 0.045
    return NextResponse.json({ ok:true, rate }, { status:200 });
  } catch (e) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
