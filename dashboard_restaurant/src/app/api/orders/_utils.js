import { query } from "../../../../lib/db";

// สร้าง/ดึงออเดอร์สถานะ draft (อ่าน service_rate จาก settings)
export async function ensureDraftOrder() {
    const found = await query(
      `SELECT * FROM orders WHERE status = 'pending' AND payment_status = 'UNPAID' ORDER BY id DESC LIMIT 1`
    );
    if (found.length) return found[0];

    const [setRow] = await query(`SELECT service_rate FROM settings WHERE id = 1`);
    const service_rate = Number(setRow?.service_rate ?? 10); // เก็บเป็นเปอร์เซ็นต์ เช่น 10.00

  // ใส่ 'pending' ตามสคีมาจริง และกำหนดค่าเริ่มต้นสำคัญให้ครบ
    const res = await query(
      `INSERT INTO orders
        (status, payment_status, items_count, subtotal, service_rate, service_charge, discount, total, created_at, opened_at)
      VALUES
        ('pending', 'UNPAID', 0, 0.00, ?, 0.00, 0.00, 0.00, NOW(), NOW())`,
      [service_rate]
    );
    const [order] = await query(`SELECT * FROM orders WHERE id = ?`, [res.insertId]);
    return order;
}
