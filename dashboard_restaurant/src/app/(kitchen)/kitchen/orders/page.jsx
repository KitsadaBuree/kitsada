// src/app/kitchen/orders/page.jsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { Loader2, Search, X } from "lucide-react";

/* ------------------------------------------------
   Config
------------------------------------------------ */
const TABS = [
  { key: "all",     label: "ทั้งหมด" },
  { key: "new",     label: "ใหม่" },
  { key: "cooking", label: "กำลังทำ" },
  { key: "ready",   label: "พร้อมเสิร์ฟ" },
];

const statusBadge = {
  pending:  "bg-slate-100 text-slate-700",
  cooking:  "bg-orange-100 text-orange-700",
  ready:    "bg-emerald-100 text-emerald-700",
};

// map สถานะ item จาก DB -> UI
function normalizeItemStatus(s) {
  if (!s) return "";
  const v = String(s).toLowerCase();
  if (v === "doing")  return "cooking";
  if (v === "done")   return "ready";
  if (v === "queued") return "pending";
  return v;
}

function clsx(...a) { return a.filter(Boolean).join(" "); }

/* ------------------------------------------------
   Fingerprint & ETag cache (ต่อให้ API ไม่ส่ง ETag เราก็กันรีได้)
------------------------------------------------ */
const etagCache = new Map(); // key -> { etag, data, fp }

// ทำ fingerprint แบบเบา ๆ จาก orders เพื่อตรวจว่าข้อมูลเปลี่ยนจริงไหม
function fpOrders(list) {
  if (!Array.isArray(list)) return "";
  const parts = [];
  for (const o of list) {
    parts.push(`${o.id}|${o.status}|${o.payment_status}|${o.closed_at || ""}`);
    const items = Array.isArray(o.items) ? o.items : [];
    for (const it of items) {
      const s = normalizeItemStatus(it?.status);
      parts.push(`i${it.id}:${s}:${it.qty}`);
    }
  }
  return parts.join(";");
}

// fetcher ที่ฉลาด: รองรับ ETag + คืน reference เดิมเมื่อเนื้อหาไม่เปลี่ยน
async function fetcherETag(key) {
  const cached = etagCache.get(key) || {};
  const headers = {};
  if (cached.etag) headers["If-None-Match"] = cached.etag;

  const res = await fetch(key, { credentials: "include", cache: "no-store", headers });

  // ถ้า 304 → คืน reference เดิมทันที
  if (res.status === 304 && cached.data) {
    return cached.data;
  }

  const json = await res.json().catch(() => null);

  // ถ้า API ไม่ ok ก็ส่งต่อไปให้ UI handle
  if (!json?.ok) return json;

  // ถ้า API ส่ง ETag ให้ cache
  const etag = res.headers.get("etag") || null;
  const nextData = json;

  // fingerprint เชิงเนื้อหา
  const nextFp = fpOrders(Array.isArray(nextData?.data) ? nextData.data : []);
  const prevFp = cached.fp;

  // ถ้าไม่มี ETag แต่เนื้อหาไม่เปลี่ยน → คืน reference เดิม
  if (!etag && prevFp && prevFp === nextFp && cached.data) {
    return cached.data;
  }

  // อัปเดตแคช
  etagCache.set(key, { etag, data: nextData, fp: nextFp });
  return nextData;
}

/* ------------------------------------------------
   Portal + Body scroll lock + Modal shell
------------------------------------------------ */
function useBodyLock(locked) {
  useEffect(() => {
    if (!locked) return;
    const prevOverflow = document.body.style.overflow;
    const prevPadRight = document.body.style.paddingRight;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadRight;
    };
  }, [locked]);
}

function Portal({ children }) {
  const elRef = useRef(null);
  if (!elRef.current && typeof document !== "undefined") {
    elRef.current = document.createElement("div");
  }
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.style.position = "relative";
    el.style.zIndex = "2147483647";
    document.body.appendChild(el);
    return () => { try { document.body.removeChild(el); } catch {} };
  }, []);
  if (!elRef.current) return null;
  return createPortal(children, elRef.current);
}

function ModalShell({ open, onClose, children }) {
  useBodyLock(open);
  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        onKeyDown={(e) => e.key === "Escape" && onClose?.()}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-[min(640px,92vw)] max-h-[80vh] overflow-auto rounded-2xl bg-white shadow-2xl">
          {children}
        </div>
      </div>
    </Portal>
  );
}

/* ------------------------------------------------
   Page
------------------------------------------------ */
export default function KitchenOrdersPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const url = useMemo(() => {
    if (typeof window === "undefined") return null;
    const u = new URL("/api/kitchen/orders", window.location.origin);
    if (tab !== "all") u.searchParams.set("status", tab);
    if (q) u.searchParams.set("q", q);
    return u.toString();
  }, [tab, q]);

  const { data, isLoading, mutate } = useSWR(url, fetcherETag, {
    refreshInterval: 10_000,
    revalidateOnFocus: true,
    refreshWhenHidden: false,  // ⛔ ไม่โพลตอนแท็บไม่โฟกัส
    keepPreviousData: true,    // รักษาข้อมูลเก่าไว้ระหว่างรีเฟตช์
    // ถ้าคุณใช้ SWR v2+ และอยากกันการอัปเดตซ้ำซ้อนอีกชั้น:
    // compare: (a, b) => fpOrders(a?.data || []) === fpOrders(b?.data || []),
  });

  const orders = data?.ok ? (data.data || []) : [];

  // อัปเดตสถานะออเดอร์ (ทั้งใบ) — ห้าม ready -> cooking
  async function updateOrderStatus(orderId, next) {
    await mutate(async (current) => {
      if (!current?.ok) return current;

      // เช็คสถานะล่าสุดจากแคชปัจจุบัน
      const currOrder = (current.data || []).find(o => o.id === orderId);
      if (currOrder?.status === "ready" && next === "cooking") {
        alert("ออเดอร์ที่พร้อมเสิร์ฟแล้ว ไม่สามารถย้อนเป็นกำลังทำได้");
        return current; // ไม่แก้แคช
      }

      const snapshot = structuredClone(current);
      const patch = structuredClone(current);
      patch.data = patch.data.map((o) =>
        o.id === orderId ? { ...o, status: next } : o
      );

      const res = await fetch(`/api/kitchen/orders/${orderId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json().catch(() => null);

      if (!json?.ok) {
        alert(json?.error || "อัปเดตไม่สำเร็จ");
        return snapshot;
      }

      // อัปเดต etagCache สำหรับ url นี้ด้วย เพื่อความเสถียรของ reference
      const key = url;
      const cached = etagCache.get(key);
      if (cached) {
        const newData = { ...patch };
        cached.data = newData;
        cached.fp = fpOrders(newData.data || []);
        etagCache.set(key, cached);
      }

      return patch;
    }, { revalidate: true });
  }

  // อัปเดตสถานะ “เมนูรายรายการ” — ห้าม ready -> cooking
  async function updateItemStatus(orderId, itemId, next) {
    await mutate(async (current) => {
      if (!current?.ok) return current;

      // เช็คสถานะล่าสุดของ item
      const orderNow = (current.data || []).find(o => o.id === orderId);
      const itemNow  = orderNow?.items?.find(it => it.id === itemId);
      const from = normalizeItemStatus(itemNow?.status);
      if (from === "ready" && next === "cooking") {
        alert("เมนูที่พร้อมเสิร์ฟแล้ว ไม่สามารถย้อนเป็นกำลังทำได้");
        return current; // ไม่แก้แคช
      }

      const snapshot = structuredClone(current);
      const patch = structuredClone(current);
      patch.data = patch.data.map((o) => {
        if (o.id !== orderId) return o;
        const items = (o.items || []).map((it) =>
          it.id === itemId ? { ...it, status: next } : it
        );
        const allReady = items.length > 0 && items.every((it) => normalizeItemStatus(it.status) === "ready");
        const status = allReady ? "ready" : o.status;
        return { ...o, items, status };
      });

      const res = await fetch(`/api/kitchen/orders/${orderId}/items/${itemId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        alert(json?.error || "อัปเดตรายการไม่สำเร็จ");
        return snapshot;
      }

      // sync etagCache เช่นกัน
      const key = url;
      const cached = etagCache.get(key);
      if (cached) {
        const newData = { ...patch };
        cached.data = newData;
        cached.fp = fpOrders(newData.data || []);
        etagCache.set(key, cached);
      }

      return patch;
    }, { revalidate: true });
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "px-3.5 py-1.5 text-sm rounded-full",
                tab === t.key ? "bg-orange-500 text-white shadow" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-[360px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && mutate()}
            placeholder="ค้นหาโต๊ะ (เช่น 5)"
            className="w-full rounded-xl bg-white border border-slate-200 pl-9 pr-3 py-2.5 outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400"
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* Board */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {(isLoading || !data) && Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}

        {data && !isLoading && orders.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400">
            ไม่มีรายการในสถานะนี้
          </div>
        )}

        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onSetOrderStatus={(next) => updateOrderStatus(order.id, next)}
            onManageItem={(itemId, next) => updateItemStatus(order.id, itemId, next)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------
   Components
------------------------------------------------ */
function SkeletonCard() {
  return (
    <div className="h-44 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="h-full grid place-items-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    </div>
  );
}

function OrderCard({ order, onSetOrderStatus, onManageItem }) {
  const [open, setOpen] = useState(false);
  const badgeCls = statusBadge[order.status] || "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* header */}
      <div className="flex items-start justify-between">
        <div className="text-slate-600">
          <div className="text-sm">โต๊ะ</div>
          <div className="text-xl font-semibold tracking-tight">#{order.table_no}</div>
        </div>
        <div className={clsx("rounded-full px-2.5 py-1 text-xs font-medium", badgeCls)}>
          {order.status === "pending" ? "ใหม่" :
           order.status === "cooking" ? "กำลังทำ" :
           order.status === "ready" ? "พร้อมเสิร์ฟ" : order.status}
        </div>
      </div>

      {/* items (ย่อ) + ป้าย note ถ้ามี) */}
      <div className="mt-3 space-y-1.5">
        {(order.items || []).slice(0, 4).map((it) => {
          const itemNote =
            it?.note ??
            it?.item_note ??
            it?.remark ??
            it?.remarks ??
            it?.options?.note ??
            it?.options_note ??
            "";

          return (
            <div key={it.id} className="flex items-center justify-between text-slate-700">
              <div className="truncate flex items-center gap-2">
                <span className="truncate">{it.name}</span>
                {itemNote && (
                  <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 border border-amber-200">
                    note
                  </span>
                )}
              </div>
              <div className="tabular-nums text-slate-500">x{it.qty}</div>
            </div>
          );
        })}
        {order.items?.length > 4 && (
          <div className="text-sm text-slate-400">…และอีก {order.items.length - 4} รายการ</div>
        )}
      </div>

      {/* action */}
      <div className="mt-4 flex">
        <button
          onClick={() => setOpen(true)}
          className="ml-auto rounded-full border px-4 py-2 text-slate-700 hover:bg-slate-50"
        >
          จัดการเมนู
        </button>
      </div>

      {open && (
        <ItemStatusModal
          order={order}
          onClose={() => setOpen(false)}
          onManageItem={onManageItem}
          onSetOrderStatus={onSetOrderStatus}
        />
      )}
    </div>
  );
}

/* ---------- Modal จัดการเมนู + สถานะออเดอร์ (ผ่าน Portal กันซ้อน) ---------- */
function ItemStatusModal({ order, onClose, onManageItem, onSetOrderStatus }) {
  const isCooking = order.status === "cooking";
  const isReady   = order.status === "ready";

  return (
    <ModalShell open={true} onClose={onClose}>
      {/* header */}
      <div className="flex items-start justify-between border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-slate-500">โต๊ะ #{order.table_no}</div>
          <div className="font-semibold truncate">ออเดอร์ #{order.order_code}</div>

          {order.note && (
            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              หมายเหตุ: {order.note}
            </div>
          )}

          {/* แถบควบคุมสถานะออเดอร์ */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500">สถานะออเดอร์:</span>
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
              <button
                onClick={() => onSetOrderStatus("cooking")}
                disabled={isReady}                                     // ⛔ ready แล้วห้ามย้อน
                className={clsx(
                  "px-3 py-1.5 text-sm rounded-full",
                  isReady && "opacity-50 pointer-events-none",
                  isCooking ? "bg-orange-500 text-white shadow" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                กำลังทำ
              </button>
              <button
                onClick={() => onSetOrderStatus("ready")}
                className={clsx(
                  "px-3 py-1.5 text-sm rounded-full",
                  isReady ? "bg-emerald-500 text-white shadow" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                พร้อมเสิร์ฟ
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="ml-3 p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          aria-label="ปิด"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* body */}
      <div className="max-h-[60vh] overflow-auto p-4 space-y-3">
        {(order.items || []).map((it) => {
          const itemNote =
            it?.note ?? it?.item_note ?? it?.remark ?? it?.remarks ?? it?.options?.note ?? it?.options_note ?? "";

          const s = normalizeItemStatus(it.status);
          const isDoing = s === "cooking";
          const isDone  = s === "ready";

          return (
            <div key={it.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{it.name}</div>
                  {itemNote && (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 border border-amber-200">
                      มีหมายเหตุ
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500">x{it.qty}</div>
                {itemNote && <div className="mt-1 text-xs leading-5 text-slate-600">หมายเหตุ: {itemNote}</div>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onManageItem(it.id, "cooking")}
                  disabled={isDone}
                  aria-disabled={isDone} // ⛔ ready แล้วห้ามย้อน
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-sm transition active:scale-[0.98]",
                    isDone && "opacity-50 pointer-events-none",
                    isDoing ? "bg-orange-500 text-white shadow" : "border hover:bg-orange-50 text-orange-600 border-orange-200"
                  )}
                >
                  กำลังทำ
                </button>
                <button
                  onClick={() => onManageItem(it.id, "ready")}
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-sm transition active:scale-[0.98]",
                    isDone ? "bg-emerald-500 text-white shadow" : "border hover:bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}
                >
                  พร้อมเสิร์ฟ
                </button>
              </div>
            </div>
          );
        })}

        {(!order.items || order.items.length === 0) && (
          <div className="text-center text-slate-500 py-10">ไม่มีรายการอาหารในใบนี้</div>
        )}
      </div>

      {/* footer */}
      <div className="border-t px-4 py-3 flex justify-end">
        <button onClick={onClose} className="rounded-lg border px-4 py-2 hover:bg-slate-50">
          ปิด
        </button>
      </div>
    </ModalShell>
  );
}
