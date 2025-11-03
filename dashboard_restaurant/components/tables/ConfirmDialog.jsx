"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/**
 * ใช้แบบ:
 * const confirm = useConfirm();
 * const ok = await confirm({ title: "...", message: "...", danger: true });
 */
export default function useConfirm() {
  const resolverRef = useRef(null);
  const [cfg, setCfg] = useState(null); // {title, message, confirmText, cancelText, danger}

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setCfg({
        title: options?.title ?? "ยืนยันการทำรายการ",
        message: options?.message ?? "",
        confirmText: options?.confirmText ?? "ยืนยัน",
        cancelText: options?.cancelText ?? "ยกเลิก",
        danger: !!options?.danger,
      });
    });
  }, []);

  const close = (v) => {
    if (resolverRef.current) resolverRef.current(v);
    resolverRef.current = null;
    setCfg(null);
  };

  // ปิดด้วย ESC / คลิกฉากหลัง
  useEffect(() => {
    if (!cfg) return;
    const onKey = (e) => e.key === "Escape" && close(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [cfg]);

  const Dialog = cfg ? (
    <Portal>
      <div className="fixed inset-0 z-[9999]">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>close(false)} />
        <div className="absolute inset-0 grid place-items-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="text-base font-semibold text-slate-900">{cfg.title}</div>
              <button
                onClick={()=>close(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {cfg.message && (
              <div className="px-5 py-4 text-slate-700">{cfg.message}</div>
            )}

            <div className="px-5 py-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={()=>close(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-slate-700 hover:bg-white"
              >
                {cfg.cancelText}
              </button>
              <button
                onClick={()=>close(true)}
                className={`h-10 rounded-xl px-5 font-semibold text-white shadow
                  ${cfg.danger ? "bg-rose-500 hover:bg-rose-600" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                {cfg.confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  ) : null;

  // component sidecar ที่ต้องแปะไว้ใน JSX
  confirm.Render = () => Dialog;

  return confirm;
}
