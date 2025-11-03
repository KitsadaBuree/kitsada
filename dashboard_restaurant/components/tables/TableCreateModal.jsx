// components/tables/TableCreateModal.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// read JSON อย่างปลอดภัย (กันกรณี API ไม่ได้คืน JSON)
async function safeJson(res) {
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** คำแนะนำสั้นๆ ใต้แถบสลับโหมด */
function Hint({ mode }) {
  return (
    <div className="mt-2 text-[13px] text-slate-600">
      {mode === "list" ? (
        <>
          เพิ่มเลขโต๊ะได้หลายเลขโดยคั่นด้วย <span className="font-medium">เว้นวรรค</span> หรือ
          <span className="font-medium"> จุลภาค (,)</span> เช่น <code>1 2 5</code> หรือ <code>1, 2, 5</code> — ระบบจะ
          <span className="font-medium"> จัดเรียง</span> และ <span className="font-medium">ตัดเลขซ้ำ</span>{" "}
          ให้อัตโนมัติ
        </>
      ) : (
        <>
          สร้างเลขต่อเนื่องโดยกรอกช่วง เช่น ตั้งแต่ <code>1</code> ถึง <code>12</code> → ระบบจะสร้างโต๊ะ{" "}
          <code>1–12</code> ให้เอง
        </>
      )}
      <div className="mt-1 text-[12px] text-slate-500">
        เคล็ดลับ: กด <kbd>Enter</kbd> หรือ <kbd>⌘/Ctrl</kbd>+<kbd>Enter</kbd> เพื่อ “เพิ่มโต๊ะ”, กด <kbd>Esc</kbd>{" "}
        เพื่อปิด
      </div>
    </div>
  );
}

export default function TableCreateModal({ open, onClose, onCreated }) {
  const [mode, setMode] = useState("list");     // "list" | "range"
  const [listText, setListText] = useState(""); // กรอก 1,2,5 หรือ 1 2 5
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // รีเซ็ตเมื่อเปิด
  useEffect(() => {
    if (!open) return;
    setMode("list");
    setListText("");
    setRangeFrom("");
    setRangeTo("");
    setSaving(false);
    setErr("");
  }, [open]);

  // ล็อกสกอร์ล + ปิดด้วย ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // แปลงอินพุต → ชุดเลข
  const numbers = useMemo(() => {
    try {
      if (mode === "list") {
        const tokens = listText
          .replace(/，/g, ",")
          .replace(/\s+/g, ",")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const arr = tokens
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n) && n > 0 && n < 100000);

        return [...new Set(arr)].sort((a, b) => a - b);
      } else {
        const a = Number(rangeFrom), b = Number(rangeTo);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return [];
        const start = Math.min(a, b), end = Math.max(a, b);
        if (start <= 0 || end - start > 2000) return [];
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
    } catch {
      return [];
    }
  }, [mode, listText, rangeFrom, rangeTo]);

  const total = numbers.length;

  // submit คีย์ลัด Enter / Cmd/Ctrl+Enter
  function handleHotkeySubmit(e) {
    if (e.key !== "Enter") return;
    const isMeta = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    if (!isMeta && document.activeElement?.tagName === "INPUT") {
      // กด Enter ธรรมดาใน input ก็ถือว่าโอเค
      createTables();
    } else if (isMeta) {
      createTables();
    }
  }

  // สร้างโต๊ะ: ตรวจซ้ำ → bulk insert
  async function createTables() {
    if (!total || saving) return;
    setSaving(true);
    setErr("");

    try {
      // 1) ตรวจเลขซ้ำ
      const chk = await fetch("/api/tables/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers }),
      });
      const chj = await safeJson(chk);
      if (!chk.ok || !chj?.ok) throw new Error(chj?.error || "ตรวจสอบเลขโต๊ะไม่สำเร็จ");

      if (Array.isArray(chj.exist) && chj.exist.length) {
        setErr(`เลขโต๊ะซ้ำ: ${chj.exist.join(", ")}`);
        setSaving(false);
        return;
      }

      // 2) เพิ่มแบบ bulk
      const bulkRes = await fetch("/api/tables/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers }),
      });
      const js = await safeJson(bulkRes);
      if (!bulkRes.ok || !js?.ok) throw new Error(js?.error || "เพิ่มโต๊ะไม่สำเร็จ");

      if (js.duplicates?.length) {
        setErr(`เพิ่มแล้วบางส่วน แต่มีเลขซ้ำ: ${js.duplicates.join(", ")}`);
      }

      onCreated?.();
      onClose?.();
    } catch (e) {
      setErr(e?.message || "เพิ่มโต๊ะไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9998]" role="dialog" aria-modal="true" onKeyDown={handleHotkeySubmit}>
        {/* backdrop */}
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
        {/* dialog */}
        <div className="fixed inset-0 grid place-items-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="text-lg font-semibold">เพิ่มโต๊ะอาหาร</div>
              <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" aria-label="ปิด">
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="px-6 py-5">
              {/* toggle */}
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 mb-2">
                <button
                  onClick={() => setMode("list")}
                  className={`px-3.5 py-1.5 text-sm rounded-full transition ${mode==="list" ? "bg-orange-500 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  เพิ่มทีละหมายเลข
                </button>
                <button
                  onClick={() => setMode("range")}
                  className={`px-3.5 py-1.5 text-sm rounded-full transition ${mode==="range" ? "bg-orange-500 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  เพิ่มเป็นช่วงเลข
                </button>
              </div>

              {/* hint */}
              <Hint mode={mode} />

              {mode === "list" ? (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">เลขโต๊ะ</label>
                  <input
                    value={listText}
                    onChange={(e)=>setListText(e.target.value)}
                    placeholder="เช่น 1 2 5 หรือ 1, 2, 5"
                    title="คั่นด้วยช่องว่างหรือจุลภาค เช่น 1 2 5 / 1, 2, 5"
                    className={`w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400
                      ${err ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:ring-orange-200 focus:border-orange-400"}`}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ตั้งแต่เลข</label>
                    <input
                      value={rangeFrom}
                      onChange={(e)=>setRangeFrom(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="เช่น 1"
                      title="เลขเริ่มต้นของช่วง"
                      className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ถึงเลข</label>
                    <input
                      value={rangeTo}
                      onChange={(e)=>setRangeTo(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="เช่น 12"
                      title="เลขสิ้นสุดของช่วง"
                      className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400"
                    />
                  </div>
                </div>
              )}

              <div className="mt-3 text-sm text-slate-600">
                จะเพิ่มทั้งหมด <span className="font-semibold">{total}</span> โต๊ะ
              </div>

              {err && (
                <div className="mt-3 rounded-xl bg-rose-50 text-rose-700 px-3 py-2 text-sm">{err}</div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-white">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-10 rounded-xl border border-slate-200 px-4 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={createTables}
                disabled={saving || total === 0}
                className="h-10 rounded-xl bg-orange-500 px-5 font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
              >
                {saving ? "กำลังเพิ่ม..." : "เพิ่มโต๊ะ"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
