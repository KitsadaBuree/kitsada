// // src/app/api/orders/create/route.js
// import { NextResponse } from "next/server";
// import { query } from "@/lib/db";
// import { verifyAuthTokenFromRequest } from "@/lib/auth";

// export async function POST(req) {
//   const body = await req.json();
//   const { table_no, items, note, totals } = body; // ตามโครงของคุณ
//   const u = await verifyAuthTokenFromRequest(req); // ถ้าไม่ล็อกอินจะได้ null

//   const result = await query(
//     `INSERT INTO orders (order_code, table_no, items_count, subtotal, service_rate, service_charge, discount, total, note, status, payment_status, user_id, created_at)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, NOW())`,
//     [
//       genOrderCode(), table_no, items.length,
//       totals.subtotal, totals.serviceRate, totals.serviceCharge,
//       totals.discount, totals.total, note || "",
//       u ? u.id : null
//     ]
//   );

//   // …บันทึกรายการย่อย items → order_items ตามเดิม
//   return NextResponse.json({ ok:true, order_id: result.insertId });
// }
