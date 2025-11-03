// src/app/api/orders/route.js
import { NextResponse } from "next/server";
import { getConnection, query } from "../../../../lib/db";
export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { tableNo = "", note = "", items = [] } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "cart is empty" }, { status: 400 });
    }

    // --- เตรียมข้อมูลสินค้า ---
    const ids = items.map(i => Number(i.id)).filter(Boolean);
    const placeholders = ids.map(() => "?").join(",");
    const products = ids.length
      ? await query(`SELECT id,name,price FROM products WHERE id IN (${placeholders})`, ids)
      : [];
    const map = new Map(products.map(p => [p.id, p]));

    let addSubtotal = 0;
    const lines = [];
    for (const i of items) {
      const p = map.get(Number(i.id));
      if (!p) {
        return NextResponse.json({ ok: false, error: `product ${i.id} not found` }, { status: 400 });
      }
      const qty  = Math.max(1, Number(i.qty || 1));
      const unit = Number(p.price || 0);
      const line = +(unit * qty).toFixed(2);
      addSubtotal += line;
      lines.push({
        product_id: p.id,
        name: p.name,
        unit_price: unit,
        qty,
        line_total: line,
        note: String(i.note || ""),
      });
    }
    addSubtotal = +addSubtotal.toFixed(2);

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      // ===== หา "ใบเปิดจริง ๆ" ของโต๊ะนี้ =====
      // เงื่อนไขใหม่: ต้อง UNPAID และยังไม่ closed เท่านั้น ถึงจะ append ได้
      const [existRows] = await conn.execute(
        `
        SELECT id, order_code, items_count, subtotal, discount, service_rate
        FROM orders
        WHERE table_no = ?
          AND payment_status = 'UNPAID'
          AND closed_at IS NULL
          AND (status IS NULL OR status <> 'canceled')
        ORDER BY id DESC
        LIMIT 1
        `,
        [String(tableNo)]
      );

      let orderId, orderCode, serviceRatePercent;

      if (Array.isArray(existRows) && existRows.length > 0) {
        // ====== มีใบเปิด → เพิ่มรายการเข้าใบเดิม ======
        const ex = existRows[0];
        orderId = ex.id;
        orderCode = ex.order_code;
        serviceRatePercent = Number(ex.service_rate ?? 0); // ใช้อัตราเดิมที่ล็อกไว้ในใบ

        const oldSubtotal = Number(ex.subtotal || 0);
        const discount    = Number(ex.discount || 0);
        const newSubtotal = +(oldSubtotal + addSubtotal).toFixed(2);

        const base           = +(newSubtotal - discount).toFixed(2);
        const service_charge = +(base * (serviceRatePercent / 100)).toFixed(2);
        const total          = +(base + service_charge).toFixed(2);
        const itemsCount     = Number(ex.items_count || 0) + items.length;

        // insert รายการใหม่
        const values = lines.flatMap(r => [
          orderId, r.product_id, r.name, r.unit_price, r.qty, r.line_total, r.note,
        ]);
        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, name, unit_price, qty, line_total, note)
           VALUES ${lines.map(() => "(?,?,?,?,?,?,?)").join(",")}`,
          values
        );

        // อัปเดตยอดรวมในใบเดิม (ตัด updated_at ออกเพื่อไม่เจอคอลัมน์ไม่อยู่)
        await conn.execute(
          `UPDATE orders
             SET items_count = ?,
                 subtotal    = ?,
                 service_charge = ?,
                 total       = ?,
                 note        = CONCAT(COALESCE(note,''), ?)
           WHERE id = ?`,
          [itemsCount, newSubtotal, service_charge, total, note ? `\n${note}` : "", orderId]
        );

        await conn.commit();
        return NextResponse.json({
          ok: true,
          data: {
            orderId,
            orderCode,
            subtotal: newSubtotal,
            service_rate: serviceRatePercent,
            service_charge,
            total,
            appended: true,
          },
        }, { status: 200 });

      } else {
        // ====== ไม่มีใบเปิด → สร้างใบใหม่ ======
        const [setting] = await query("SELECT service_rate FROM settings WHERE id=1");
        serviceRatePercent = Number(setting?.service_rate ?? 10); // เช่น 2.50
        const serviceRate = serviceRatePercent / 100;

        const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        orderCode = `O${ymd}-${Math.floor(Math.random() * 9000 + 1000)}`;

        const discount       = 0;
        const base           = +(addSubtotal - discount).toFixed(2);
        const service_charge = +(base * serviceRate).toFixed(2);
        const total          = +(base + service_charge).toFixed(2);

        const [res] = await conn.execute(
          `INSERT INTO orders
            (order_code, table_no, items_count, subtotal, discount, service_rate, service_charge, total, note, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            orderCode, String(tableNo), items.length, addSubtotal, discount,
            serviceRatePercent, service_charge, total, String(note),
          ]
        );
        orderId = res.insertId;

        const values = lines.flatMap(r => [
          orderId, r.product_id, r.name, r.unit_price, r.qty, r.line_total, r.note,
        ]);
        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, name, unit_price, qty, line_total, note)
           VALUES ${lines.map(() => "(?,?,?,?,?,?,?)").join(",")}`,
          values
        );

        await conn.commit();
        return NextResponse.json({
          ok: true,
          data: {
            orderId,
            orderCode,
            subtotal: addSubtotal,
            service_rate: serviceRatePercent,
            service_charge,
            total,
            appended: false,
          },
        }, { status: 201 });
      }
    } catch (e) {
      try { await conn.rollback(); } catch {}
      throw e;
    } finally {
      try { conn.release(); } catch {}
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
