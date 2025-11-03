// components/tables/TablesClient.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, QrCode, Download, Trash2, CheckSquare, X } from "lucide-react";
import TableQrModal from "./TablesQrMordal";
import TableCreateModal from "./TableCreateModal";
import useConfirm from "./ConfirmDialog";

/* STATUS: เหลือแค่ ว่าง/มีออเดอร์ */
const STATUS = {
  free: { label: "ว่าง",      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  busy: { label: "มีออเดอร์", cls: "bg-violet-50  text-violet-700  ring-violet-200" },
};

/* ---- ตัดสินสถานะ: มีออเดอร์ ถ้า openCount>0 หรือ lastStatus เป็น UNPAID/CHECKING ---- */
function normalizeStatus(row) {
  const openCount = Number(
    row.open_orders ??
    row.open_orders_count ??
    row.openCount ??
    row.orders_open ??
    0
  );
  const lastStatus = String(
    row.last_order_status ??
    row.last_payment_status ??
    row.payment_status ??
    ""
  ).toUpperCase();

  const isBusy = openCount > 0 || ["UNPAID", "CHECKING"].includes(lastStatus);
  return isBusy ? "busy" : "free";
}

/* ---- parse JSON แบบปลอดภัย ---- */
async function safeJson(res) {
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default function TablesClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");      // '', 'free','busy'
  const [qrOpen, setQrOpen] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const confirm = useConfirm();

  async function loadTables() {
    try {
      setLoading(true);
      const res = await fetch("/api/tables", { cache: "no-store" });
      const json = await safeJson(res);
      if (!res.ok || !json?.ok) {
        const msg = json?.error || `โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`;
        throw new Error(msg);
      }
      
      const mapped = (json.data || []).map((r) => {
        const rawNum = (r.number !== undefined && r.number !== null)
          ? r.number
          : (r.name !== undefined && r.name !== null ? r.name : "");

        return {
          id: r.id,
          code: r.code || r.table_code || "",
          number: (typeof rawNum === "number") ? rawNum : (Number(rawNum) || String(rawNum) || ""),
          // ถ้ามีออเดอร์ UNPAID/CHECKING = มีออเดอร์, ไม่งั้น = ว่าง
          status: r.open_orders > 0 ? "busy" : "free",
        };
      });
      setRows(mapped);

    } catch (e) {
      console.error(e);
      alert(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTables();
    const t = setInterval(loadTables, 10000);
    return () => clearInterval(t);
  }, []);

  const shown = useMemo(() => {
    return rows.filter(r => {
      const passQ =
        !q ||
        String(r.number).includes(q) ||
        String(r.code).toLowerCase().includes(q.toLowerCase());
      const passF = !filter || r.status === filter;
      return passQ && passF;
    });
  }, [rows, q, filter]);

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectAllCurrent() { setSelected(new Set(shown.map(r => r.id))); }
  function clearSelection() { setSelected(new Set()); }

  async function handleDeleteOne(id) {
    const ok = await confirm({
      title: "ลบโต๊ะ",
      message: "ยืนยันลบโต๊ะนี้?",
      confirmText: "ลบเลย",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      const json = await safeJson(res);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "ลบไม่สำเร็จ");
      await loadTables();
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    } catch (e) {
      alert(e?.message || "ลบไม่สำเร็จ");
    }
  }

  async function handleDeleteBulk() {
    if (!selected.size) return;
    const ok = await confirm({
      title: "ลบโต๊ะหลายรายการ",
      message: `ยืนยันลบโต๊ะที่เลือก ${selected.size} รายการ?`,
      confirmText: "ลบที่เลือก",
      cancelText: "ยกเลิก",
      danger: true,
    });
    if (!ok) return;
    try {
      await Promise.all(
        [...selected].map(async (id) => {
          const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
          const json = await safeJson(res);
          if (!res.ok || !json?.ok) throw new Error(json?.error || `ลบโต๊ะ ${id} ไม่สำเร็จ`);
        })
      );
      clearSelection();
      await loadTables();
    } catch (e) {
      alert(e?.message || "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="relative rounded-[22px] bg-white/90 backdrop-blur border border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 border-b border-slate-200/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* search */}
          <div className="relative w-full sm:w-[420px]">
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="ค้นหา: เลขโต๊ะ หรือ CODE"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={()=>setCreateOpen(true)}
              className="inline-flex items-center gap-2 h-10 rounded-full bg-orange-500 px-4 text-white hover:bg-orange-600 shadow-sm"
            >
              <Plus className="h-4 w-4" /> เพิ่มโต๊ะ
            </button>
            <button
              onClick={loadTables}
              className="inline-flex items-center gap-2 h-10 rounded-full bg-white px-4 text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200"
              title="รีเฟรชสถานะ"
            >
              รีเฟรช
            </button>
          </div>
        </div>

        {/* segmented filter + counter (ตัด 'ปิดใช้งาน' ออก) */}
        <div className="flex items-center gap-2 justify-between">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
            {[
              ["","ทั้งหมด"],
              ["free","ว่าง"],
              ["busy","มีออเดอร์"],
            ].map(([k, lb]) => {
              const active = filter === k;
              return (
                <button
                  key={k || "all"}
                  onClick={()=>setFilter(k)}
                  className={`px-3.5 py-1.5 text-sm rounded-full transition
                    ${active ? "bg-orange-500 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
                >{lb}</button>
              );
            })}
          </div>

          <div className="text-sm text-slate-500">
            แสดง {loading ? "…" : shown.length} / {rows.length} โต๊ะ
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))] gap-4">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="h-[150px] rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState onCreate={()=>setCreateOpen(true)} />
        ) : (
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))] gap-4">
            {shown.map(r=>(
              <TableCard
                key={r.id}
                row={r}
                checked={selected.has(r.id)}
                onCheck={()=>toggleSelect(r.id)}
                onShowQr={()=>setQrOpen(r)}
                onDelete={()=>handleDeleteOne(r.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 z-20">
          <div className="m-3 rounded-2xl border bg-white/95 backdrop-blur px-4 py-3 shadow-lg ring-1 ring-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <CheckSquare className="h-5 w-5" />
              เลือก {selected.size} รายการ
              <button onClick={selectAllCurrent} className="ml-3 text-sm underline decoration-slate-300 hover:text-slate-900">
                เลือกทั้งหมดในหน้านี้
              </button>
              <span className="mx-1 text-slate-300">|</span>
              <button onClick={clearSelection} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                <X className="h-4 w-4" /> ล้างการเลือก
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteBulk}
                className="h-9 rounded-xl border border-rose-300 bg-rose-50 px-4 text-rose-700 hover:bg-rose-100"
              >
                ลบที่เลือก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TableQrModal open={!!qrOpen} row={qrOpen} onClose={()=>setQrOpen(null)} />
      <TableCreateModal
        open={createOpen}
        onClose={()=>setCreateOpen(false)}
        onCreated={loadTables}
      />
      <confirm.Render />
    </div>
  );
}

/* ===== Sub components ===== */
function Pill({ children, cls }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium ring-1 ${cls}`}>
      {children}
    </span>
  );
}

function TableCard({ row, checked, onCheck, onShowQr, onDelete }) {
  const st = STATUS[row.status] ?? STATUS.free;
  const baseBtn =
    "inline-flex items-center justify-center gap-2 h-10 rounded-2xl " +
    "bg-white ring-1 ring-slate-200 px-4 text-slate-700 hover:bg-slate-50 " +
    "transition shadow-sm";

  return (
    <div className="group min-h-[156px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={onCheck}
            className="accent-orange-500 h-4 w-4"
            aria-label={`เลือกโต๊ะ ${row.number}`}
          />
          <div className="h-9 w-9 rounded-full bg-slate-50 grid place-items-center ring-1 ring-slate-200">
            <span className="text-slate-700 font-semibold">{row.number}</span>
          </div>
        </label>
        <Pill cls={st.cls}>{st.label}</Pill>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-slate-400 tracking-wide">CODE</div>
        <div className="text-sm font-medium text-slate-900">{row.code}</div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
        <button onClick={onShowQr} className={baseBtn} aria-label={`แสดง QR โต๊ะ ${row.number}`}>
          <QrCode className="h-4 w-4" />
          QR
        </button>

        <button
          onClick={() => downloadQr(`/t/${row.code}`, `table-${row.number}.png`)}
          className={baseBtn}
          aria-label={`โหลด QR โต๊ะ ${row.number}`}
        >
          <Download className="h-4 w-4" />
          โหลด
        </button>

        <button
          onClick={onDelete}
          className="inline-flex items-center justify-center gap-2 h-10 rounded-2xl px-4 text-rose-700 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200 shadow-sm"
        >
          <Trash2 className="h-4 w-4" />
          ลบ
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="py-16 text-center">
      <div className="text-slate-500">ยังไม่มีโต๊ะในเงื่อนไขนี้</div>
      <button
        onClick={onCreate}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
      >
        <Plus className="h-4 w-4" /> เพิ่มโต๊ะใหม่
      </button>
    </div>
  );
}

/* ===== Utils ===== */
async function downloadQr(path, filename) {
  const QR = (await import("qrcode")).default;
  const dataUrl = await QR.toDataURL(`${window.location.origin}${path}`, { margin: 1, width: 800 });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
