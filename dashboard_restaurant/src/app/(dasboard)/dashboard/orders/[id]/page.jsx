// app/(dashboard)/orders/[id]/page.jsx
"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "../../../../../../components/orders/ConfirmDialog";
import Toast from "../../../../../../components/orders/Toast";

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="100%" height="100%" rx="12" fill="#f1f5f9"/><text x="50%" y="52%" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#94a3b8">No Image</text></svg>'
  );

async function safeJsonFetch(url, init) {
  const r = await fetch(url, { cache: "no-store", ...init });
  if (!r.ok) throw new Error((await r.text().catch(() => "")) || `HTTP ${r.status}`);
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new Error("Bad content-type");
  return r.json();
}

const fmtTHB = (n) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" })
    .format(Number.isFinite(+n) ? +n : 0);

export default function OrderDetailPage({ params }) {
  const { id: idRaw } = use(params);
  const id = Number(idRaw) || 0;

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [removeTarget, setRemoveTarget] = useState(null);
  const [busyRemove, setBusyRemove] = useState(false);
  const [toast, setToast] = useState({ show: false, text: "", type: "success" });

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErr("");
      const o = await safeJsonFetch(`/api/orders/${id}`);
      if (o?.ok) setOrder(o.order ?? null);

      const it = await safeJsonFetch(`/api/orders/${id}/items`);
      if (it?.ok) setItems(Array.isArray(it.items) ? it.items : []);
    } catch (e) {
      setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ใช้สำหรับกล่อง "ราคารวม" ด้านบน
  const subtotal = useMemo(() => {
    return items.reduce((s, it) => {
      if (it?.line_total != null) return s + Number(it.line_total || 0);
      return s + Number(it.unit_price || 0) * Number(it.qty || 0);
    }, 0);
  }, [items]);

  const countLabel = `${(items?.length ?? 0).toLocaleString("th-TH")} รายการ`;

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      setBusyRemove(true);
      const itemId = Number(removeTarget.id);
      const prev = items;
      setItems((arr) => arr.filter((x) => x.id !== itemId));
      const res = await safeJsonFetch(`/api/orders/${id}/items/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res?.ok) {
        setItems(prev);
        throw new Error(res?.error || "ลบไม่สำเร็จ");
      }
      setToast({ show: true, text: "ลบรายการสำเร็จ", type: "success" });
    } catch (e) {
      setToast({ show: true, text: e.message || "ลบไม่สำเร็จ", type: "error" });
    } finally {
      setBusyRemove(false);
      setRemoveTarget(null);
    }
  };

  const StatusPill = ({ value }) => {
    const v = String(value || "").toLowerCase();
    const label =
      v === "ready" ? "พร้อมเสิร์ฟ" :
      v === "doing" ? "กำลังทำ" :
      v === "done" ? "เสิร์ฟแล้ว" :
      v === "canceled" ? "ยกเลิก" : "รอดำเนินการ";
    const style =
      v === "ready"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : v === "doing"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : v === "done"
        ? "bg-slate-100 text-slate-700 ring-slate-200"
        : v === "canceled"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-slate-50 text-slate-700 ring-slate-200";
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="w-full space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500 text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 2v20l3-2 3 2 3-2 3 2V2z"/><path d="M8 6h8M8 10h8M8 14h6"/>
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ออเดอร์ #{id || "-"}</h1>
            <div className="mt-1 inline-flex flex-wrap items-center gap-2">
              {order?.table_no && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  โต๊ะ {order.table_no}
                </span>
              )}
              {order?.status && <StatusPill value={order.status} />}
              <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200">
                {countLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ขวา: ราคารวม + ปุ่ม */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div
            className="rounded-2xl border px-4 py-2.5 shadow-sm"
            style={{ borderColor: "#F4B899", background: "#fff" }}
            title="ราคารวม (รวมยอดตามรายการ)"
          >
            <div className="text-[13px] text-slate-500 leading-none mb-0.5">ราคารวม</div>
            <div className="text-xl font-semibold text-slate-900 -tracking-[0.01em]">
              {fmtTHB(subtotal)}
            </div>
          </div>

          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M15 18l-6-6 6-6"/><path d="M21 12H9"/>
            </svg>
            กลับหน้าออเดอร์
          </Link>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v7h-7"/>
            </svg>
            รีเฟรช
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Table (ไม่มีคอลัมน์ “รวม” แล้ว) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/90 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60">
              <tr>
                <th className="px-4 py-3 text-left">รหัสอาหาร</th>
                <th className="px-4 py-3 text-left">ชื่อ</th>
                <th className="px-4 py-3 text-left">รูปภาพ</th>
                <th className="px-4 py-3 text-right">ราคา/หน่วย</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-left">รายละเอียดเพิ่มเติม</th>
                <th className="px-4 py-3 text-center">จำนวน</th>
                <th className="px-4 py-3 text-center">ลบ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800 [&>tr:hover]:bg-slate-50/60">
              {loading && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-slate-200"/></td>
                      <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-slate-200"/></td>
                      <td className="px-4 py-3"><div className="h-12 w-12 rounded-xl bg-slate-200"/></td>
                      <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-14 rounded bg-slate-200"/></td>
                      <td className="px-4 py-3 text-center"><div className="mx-auto h-6 w-20 rounded-full bg-slate-200"/></td>
                      <td className="px-4 py-3"><div className="h-9 w-full rounded bg-slate-200"/></td>
                      <td className="px-4 py-3 text-center"><div className="mx-auto h-7 w-10 rounded bg-slate-200"/></td>
                      <td className="px-4 py-3 text-center"><div className="mx-auto h-7 w-14 rounded bg-slate-200"/></td>
                    </tr>
                  ))}
                </>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16">
                    <div className="grid place-items-center text-center">
                      <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 grid place-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M6 2v20l3-2 3 2 3-2 3 2V2z"/><path d="M8 6h8M8 10h8M8 14h6"/>
                        </svg>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">ยังไม่มีรายการในออเดอร์</h3>
                      <p className="text-slate-600">เพิ่มรายการจากหน้ารับออเดอร์ หรือกลับไปหน้ารายการออเดอร์เพื่อเลือกโต๊ะอื่น</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {String(it.id).padStart(6, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{it.name}</div>
                    {it.category && <div className="mt-0.5 text-xs text-slate-500">{it.category}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl ring-1 ring-slate-200">
                      <img
                        src={it.image_url ?? it.imageUrl ?? FALLBACK_IMG}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {(Number(it.unit_price ?? it.price) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusPill value={it.status} />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={it.note?.trim() ? it.note : "—"}
                      readOnly disabled
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex min-w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 tabular-nums text-slate-700">
                      {Number(it.qty) || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setRemoveTarget(it)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-rose-700 hover:bg-rose-100"
                      title="ลบรายการ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 6h18"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="ลบรายการอาหาร?"
        message={removeTarget ? `ต้องการลบ “${removeTarget.name ?? "รายการนี้"}” ออกจากออเดอร์หรือไม่` : ""}
        confirmText="ลบรายการ"
        cancelText="ยกเลิก"
        busy={busyRemove}
        onConfirm={confirmRemove}
        onClose={() => !busyRemove && setRemoveTarget(null)}
      />

      <Toast
        text={toast.text}
        type={toast.type}
        show={toast.show}
        onDone={() => setToast((t) => ({ ...t, show: false }))}
      />
    </div>
  );
}
