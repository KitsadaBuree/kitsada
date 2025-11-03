// src/app/api/orders/[code]/request-bill/route.js
import { NextResponse } from "next/server";
import { query, getConnection } from "../../../../../../lib/db";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "../../../../../../lib/auth";
export const runtime = "nodejs";

// อ่าน userId จาก cookie (ต้อง await cookies() ใน Next.js 15)
async function getUserIdFromCookie() {
  try {
    const ck = await cookies();
    const token = ck.get(COOKIE_NAME)?.value;
    const payload = token ? verifyToken(token) : null;
    const id = Number(payload?.id);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export async function POST(req, ctx) {
  try {
    // ✔ params เป็น Promise → ต้อง await ก่อน
    const { code } = await ctx.params;
    if (!code) {
      return NextResponse.json({ ok: false, error: "missing code" }, { status: 400 });
    }

    // payload จากฝั่ง UI (ถ้าไม่มี ก็ให้เป็น 0)
    let body = {};
    try { body = await req.json(); } catch {}
    const reqPoints   = Math.max(0, Number(body.points_used || 0));   // แต้มที่ขอใช้
    const discountReq = Math.max(0, Number(body.discount_baht || 0)); // ส่วนลด (บาท)
    const subReq      = Math.max(0, Number(body.subtotal || 0));
    const svcReq      = Math.max(0, Number(body.service_charge || 0));
    const netReq      = Math.max(0, Number(body.grand_total || 0));   // ยอดสุทธิ (UI)

    // โหลดออเดอร์รอบแรก
    const [order] = await query(
      `SELECT id, user_id, subtotal, service_rate, service_charge, discount, total,
              payment_status, note, COALESCE(points_awarded,0) AS points_awarded
         FROM orders
        WHERE order_code=? LIMIT 1`,
      [code]
    );
    if (!order) return NextResponse.json({ ok:false, error:"not found" }, { status:404 });

    // ✔ ต้อง await
    const userIdCookie = await getUserIdFromCookie();

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      // --- อัปเดตสถานะเป็น CHECKING ถ้ายังไม่ PAID ---
      if (order.payment_status !== "PAID") {
        await conn.execute(
          `UPDATE orders SET payment_status='CHECKING' WHERE id=?`,
          [order.id]
        );
      }

      // === 1) ผูก user เข้ากับออเดอร์ ===
      let linkedUser = false;
      if (userIdCookie && (!order.user_id || Number(order.user_id) === 0)) {
        await conn.execute(
          `UPDATE orders
              SET user_id=?
            WHERE id=? AND (user_id IS NULL OR user_id=0)`,
          [userIdCookie, order.id]
        );
        order.user_id = userIdCookie;
        linkedUser = true;
      }

      // === 2) ใช้แต้ม (หักแต้ม) ===
      let usedPoints = 0;
      let usedMarkerWritten = false;
      const noteStr = String(order.note || "");
      const USED_MARK = "[P_USED_DONE]";

      if (order.user_id && reqPoints > 0 && !noteStr.includes(USED_MARK)) {
        // ล็อคแถว users กันการแข่งกันหักแต้มพร้อมกัน
        const [rows] = await conn.query(
          `SELECT id, points FROM users WHERE id=? FOR UPDATE`,
          [order.user_id]
        );
        const user = rows?.[0];

        if (user) {
          const maxBaht = (subReq || Number(order.subtotal||0))
                        + (svcReq || Number(order.service_charge||0));
          const maxSteps = Math.floor(Math.max(0, maxBaht) / 1); // 100 pt = 1 ฿
          const maxPointsByAmount = maxSteps * 100;

          const canUse = Math.max(
            0,
            Math.min(
              reqPoints,                 // ที่ขอใช้จาก UI
              Number(user.points || 0),  // แต้มที่มีจริง
              maxPointsByAmount          // ไม่เกินยอด
            )
          );
          usedPoints = Math.floor(canUse / 100) * 100; // ปรับเป็นสเต็ป 100

          if (usedPoints > 0) {
            await conn.execute(
              `UPDATE users SET points = points - ? WHERE id=?`,
              [usedPoints, order.user_id]
            );
            await conn.execute(
              `UPDATE orders
                  SET note = CONCAT(COALESCE(note,''),' ${USED_MARK}')
                WHERE id=?`,
              [order.id]
            );
            usedMarkerWritten = true;
          }
        }
      }

      // === 3) อัปเดตยอดใน orders (ใช้ค่าที่ UI คำนวณมา) ===
      const discountBaht = discountReq;
      const svcCharge    = svcReq;
      const grandTotal   = netReq;

      await conn.execute(
        `UPDATE orders
            SET discount = ?,
                service_charge = ?,
                total = ?
          WHERE id=?`,
        [discountBaht, svcCharge, grandTotal, order.id]
      );

      // === 4) บวกแต้มสะสมครั้งเดียว หลังจากคำนวณยอดสุทธิแล้ว ===
      let pointsEarned = 0;
      if (order.user_id && Number(order.points_awarded) === 0) {
        pointsEarned = Math.floor(grandTotal / 10);
        if (pointsEarned > 0) {
          await conn.execute(
            `UPDATE users SET points = points + ? WHERE id=?`,
            [pointsEarned, order.user_id]
          );
        }
        await conn.execute(
          `UPDATE orders SET points_awarded=1 WHERE id=?`,
          [order.id]
        );
      }

      await conn.commit();

      return NextResponse.json({
        ok: true,
        linkedUser,
        usedPoints,
        usedMarkerWritten,
        discountBaht,
        grandTotal,
        pointsEarned,
      }, { status: 200 });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (e) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
