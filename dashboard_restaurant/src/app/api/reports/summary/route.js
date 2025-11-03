// src/app/api/reports/summary/route.js
import { query } from "../../../../../lib/db";
export const runtime = "nodejs";

const DEFAULT_MARGIN_PCT = Number(process.env.MARGIN_PCT || 35);
const KEY_TIME = "COALESCE(o.paid_at, o.closed_at, o.created_at)";
const TOTAL_EXPR = "COALESCE(o.total, o.subtotal + o.service_charge - o.discount, 0)";

function parseG(g) {
  const v = String(g || "day").toLowerCase();
  return ["day", "month", "year"].includes(v) ? v : "day";
}
function ensureDate(s) {
  const d = new Date(s || Date.now());
  if (isNaN(d)) throw new Error("bad date");
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
// date range [start, end)
function rangeFrom(granularity, dateIso) {
  const d = new Date(dateIso);
  if (isNaN(d)) throw new Error("bad date range");
  const start = new Date(d);
  let end;
  if (granularity === "day") {
    end = new Date(d); end.setDate(end.getDate() + 1);
  } else if (granularity === "month") {
    end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    start.setDate(1);
  } else {
    end = new Date(d.getFullYear() + 1, 0, 1);
    start.setMonth(0, 1);
  }
  const toIso = (x) => x.toISOString().slice(0, 19).replace("T", " ");
  return { startISO: toIso(start), endISO: toIso(end) };
}



export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const g = parseG(searchParams.get("granularity"));
    const date = ensureDate(searchParams.get("date"));

    const { startISO, endISO } = rangeFrom(g, date);
    const binds = [startISO, endISO];
    const whereRange = `${KEY_TIME} >= ? AND ${KEY_TIME} < ?`;

    const { startISO: monthStartISO, endISO: monthEndISO } = rangeFrom("month", date);
    const monthBinds = [monthStartISO, monthEndISO];
    const whereMonth = `${KEY_TIME} >= ? AND ${KEY_TIME} < ?`;

    /* ----- 1) ยอดขายรวม (บาท) ----- */
    const totalRows = await query(
      `SELECT COALESCE(SUM(${TOTAL_EXPR}),0) AS sum_total
         FROM orders o
        WHERE o.payment_status='PAID' AND ${whereRange}`,
      binds
    );
    const periodTotal = Number(totalRows[0]?.sum_total || 0);

    /* ===== เพิ่มใหม่: จำนวนบิล/ออเดอร์ในช่วง ===== */
    const ordersCntRows = await query(
      `SELECT COUNT(*) AS cnt
         FROM orders o
        WHERE o.payment_status='PAID' AND ${whereRange}`,
      binds
    );
    const ordersCount = Number(ordersCntRows[0]?.cnt || 0);
    /* ===== จบส่วนเพิ่มใหม่ ===== */

    /* ----- 2) ยอดขายตามแกนเวลา (บาท) ----- */
    const selectKey = g === "year"
      ? `DATE_FORMAT(${KEY_TIME}, '%Y-%m-01')`
      : `DATE(${KEY_TIME})`;
    const byDate = await query(
      `SELECT ${selectKey} AS dkey, COALESCE(SUM(${TOTAL_EXPR}),0) AS amount
         FROM orders o
        WHERE o.payment_status='PAID' AND ${whereRange}
        GROUP BY dkey
        ORDER BY dkey`,
      binds
    );
    const salesByDate = byDate.map(r => ({
      iso: r.dkey, date: r.dkey, label: r.dkey, amount: Number(r.amount || 0),
    }));

    /* ----- 3) เมนูขายดี ----- */
    const topRows = await query(
      `SELECT COALESCE(oi.name,'(ไม่ระบุ)') AS name, COALESCE(SUM(oi.qty),0) AS qty_sum
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.payment_status='PAID' AND ${whereRange}
        GROUP BY COALESCE(oi.name,'(ไม่ระบุ)')
        ORDER BY qty_sum DESC
        LIMIT 8`,
      binds
    );
    const maxQty = Math.max(1, ...topRows.map(r => Number(r.qty_sum || 0)));
    const topSellers = topRows.map(r => ({
      name: r.name,
      percent: Math.round((Number(r.qty_sum || 0) / maxQty) * 100),
      orders: Number(r.qty_sum || 0),
    }));

    /* ----- 4) จำนวนเมนูไม่ซ้ำ ----- */
    const menuCntRows = await query(
      `SELECT COUNT(DISTINCT
          CASE
            WHEN oi.product_id IS NOT NULL THEN CONCAT('ID:', oi.product_id)
            ELSE CONCAT('N:', COALESCE(oi.name,''))
          END
        ) AS menu_count
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.payment_status='PAID' AND ${whereRange}`,
      binds
    );
    const todayMenuCount = Number(menuCntRows[0]?.menu_count || 0);

    /* ----- 5) จำนวนจานตามช่วงที่เลือก ----- */
    const platesRows = await query(
      `SELECT COALESCE(SUM(oi.qty),0) AS plates
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.payment_status='PAID' AND ${whereRange}`,
      binds
    );
    const platesCount = Number(platesRows[0]?.plates || 0);

    /* ----- 6) จำนวนจานแบบสะสมทั้งเดือน (MTD) ----- */
    const platesRowsMonth = await query(
      `SELECT COALESCE(SUM(oi.qty),0) AS plates
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.payment_status='PAID' AND ${whereMonth}`,
      monthBinds
    );
    const platesCountMonth = Number(platesRowsMonth[0]?.plates || 0);

    /* ----- 7) รายการเมนูทั้งหมด & pivot ต่อวัน ----- */
    const menusRows = await query(
      `SELECT COALESCE(oi.name,'(ไม่ระบุ)') AS menu, COALESCE(SUM(oi.qty),0) AS q
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.payment_status='PAID' AND ${whereRange}
        GROUP BY COALESCE(oi.name,'(ไม่ระบุ)')
        ORDER BY q DESC`,
      binds
    );
    const menus = menusRows.map(r => r.menu);

    const rawMenuByDate = await query(
      `SELECT DATE(${KEY_TIME}) AS d, COALESCE(oi.name,'(ไม่ระบุ)') AS menu, COALESCE(SUM(oi.qty),0) AS q
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.payment_status='PAID' AND ${whereRange}
        GROUP BY DATE(${KEY_TIME}), COALESCE(oi.name,'(ไม่ระบุ)')
        ORDER BY d ASC`,
      binds
    );
    const pivot = new Map();
    for (const r of rawMenuByDate) {
      if (!pivot.has(r.d)) pivot.set(r.d, { label: r.d });
      pivot.get(r.d)[r.menu] = Number(r.q || 0);
    }
    const menuSalesByDate = Array.from(pivot.values());

    /* ----- 8) พฤติกรรมรายวัน (จ–อา) ----- */
    const wkRows = await query(
      `SELECT DAYOFWEEK(${KEY_TIME}) AS dw, COALESCE(SUM(oi.qty),0) AS total_qty
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.payment_status='PAID' AND ${whereRange}
        GROUP BY DAYOFWEEK(${KEY_TIME})
        ORDER BY dw`,
      binds
    );
    const thDays = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสฯ","ศุกร์","เสาร์"];
    const weekdayPattern = wkRows.map(r => ({
      weekday: thDays[(Number(r.dw || 1) - 1) % 7],
      total: Number(r.total_qty || 0),
    }));

    /* ----- 9) ประวัติการขาย ----- */
    const historyRows = await query(
      `SELECT o.id, o.table_no, o.order_code, ${TOTAL_EXPR} AS total, ${KEY_TIME} AS t
         FROM orders o
        WHERE o.payment_status='PAID' AND ${whereRange}
        ORDER BY ${KEY_TIME} DESC
        LIMIT 20`,
      binds
    );
    const history = historyRows.map(r => ({
      id: r.id,
      table: r.table_no,
      date: r.t,
      total: Number(r.total || 0),
      billUrl: `/dashboard/orders/${r.id}`,
    }));

    return Response.json({
      ok: true,
      data: {
        granularity: g,
        date,
        todaySales: periodTotal,
        ordersCount,          // ⬅️ เพิ่มส่งออก จำนวนบิล/ออเดอร์
        todayMenuCount,
        profitPct: DEFAULT_MARGIN_PCT,
        salesByDate,
        topSellers,
        history,
        platesCount,
        platesCountMonth,
        menus,
        menuSalesByDate,
        weekdayPattern,
      },
    });
  } catch (e) {
    console.error("GET /api/reports/summary error:", e);
    return Response.json({ ok:false, error:e.message }, { status:500 });
  }
}

