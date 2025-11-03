// // src/app/api/profile/orders/route.js
// import { NextResponse } from "next/server";
// import { query } from "../../../../../lib/db";
// import { verifyAuthTokenFromRequest } from "../../../../../lib/auth";

// export async function GET(req) {
//   const user = await verifyAuthTokenFromRequest(req);
//   if (!user) {
//     return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
//   }

//   const url = new URL(req.url);
//   const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

//   try {
//     // สคีมาที่ใช้คอลัมน์ user_id
//     const rows = await query(
//       `SELECT id, order_code, table_no, items_count, total, status, payment_status, created_at
//          FROM orders
//         WHERE user_id = ?
//      ORDER BY id DESC
//         LIMIT ?`,
//       [user.id, limit]
//     );
//     return NextResponse.json({ ok: true, orders: rows });
//   } catch (e1) {
//     // ถ้าโปรเจกต์เดิมใช้ชื่อคอลัมน์ customer_id ให้ลอง fallback
//     try {
//       const rows2 = await query(
//         `SELECT id, order_code, table_no, items_count, total, status, payment_status, created_at
//            FROM orders
//           WHERE customer_id = ?
//        ORDER BY id DESC
//           LIMIT ?`,
//         [user.id, limit]
//       );
//       return NextResponse.json({ ok: true, orders: rows2 });
//     } catch (e2) {
//       console.error("ORDERS_ERROR:", e2?.message || e2);
//       return NextResponse.json({ ok: false, error: "ORDERS_QUERY_FAILED" }, { status: 500 });
//     }
//   }
// }
