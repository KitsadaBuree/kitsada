"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { buildTableUrl } from "../../lib/url";

function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export default function TableQrModal({ open, row, onClose }) {
  const [imgDataUrl, setImgDataUrl] = useState("");
  const [qrSize, setQrSize] = useState(360); // ขนาดกลางพอดี

  // ✅ เปลี่ยนมาสร้างลิงก์ด้วย util (ไม่ผูกกับ window.origin แล้ว)
  const url = useMemo(() => {
    if (!row?.code) return "";
    return buildTableUrl(row.code);
  }, [row?.code]);

  // คำนวณให้พอดีจอ (ไม่มีปุ่มปรับขนาด)
  useEffect(() => {
    if (!open) return;
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const target = 360; // ขนาดกลาง
      const size = Math.min(target, Math.floor(vw * 0.6), Math.floor(vh * 0.45));
      setQrSize(Math.max(240, size)); // กันเล็กเกิน
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [open]);

  // สร้างรูป QR
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !url) { setImgDataUrl(""); return; }
      const QR = (await import("qrcode")).default;
      const dataUrl = await QR.toDataURL(url, { margin: 1, width: qrSize });
      if (alive) setImgDataUrl(dataUrl);
    })();
    return () => { alive = false; };
  }, [open, url, qrSize]);

  // ล็อกสกอลล์ + ปิดด้วย Esc
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => { html.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  function copyLink() { if (url) navigator.clipboard?.writeText(url); }
  function openLink() { if (url) window.open(url, "_blank", "noopener,noreferrer"); }
  function downloadPng() {
    if (!imgDataUrl) return;
    const a = document.createElement("a");
    a.href = imgDataUrl;
    a.download = `table-${row?.number ?? row?.code}.png`;
    a.click();
  }
  function printQr() {
    if (!imgDataUrl) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>QR โต๊ะ ${row?.number ?? ""}</title></head>
      <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh">
        <img src="${imgDataUrl}" style="max-width:90vw;max-height:90vh"/>
      </body></html>
    `);
    w.document.close(); w.focus(); w.onload = () => w.print();
  }

  if (!open || !row) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-0 grid place-items-center p-3 sm:p-4">
          <div
            className="w-full max-w-[760px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
            style={{ maxHeight: "88vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="text-[15px] font-semibold text-slate-900">QR โต๊ะ {row.number ?? "-"}</div>
              <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" aria-label="ปิด">
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="grid gap-4 p-4 sm:p-5">
              <div className="mx-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                {imgDataUrl
                  ? <img src={imgDataUrl} alt={`QR โต๊ะ ${row.number ?? row.code}`}
                         style={{ width: qrSize, height: qrSize }} />
                  : <div className="animate-pulse rounded-xl bg-slate-100"
                         style={{ width: qrSize, height: qrSize }} />}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                <div className="truncate">{url}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={copyLink}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
                  คัดลอกลิงก์
                </button>
                <button onClick={openLink}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
                  เปิดลิงก์
                </button>
                <button onClick={downloadPng}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
                  ดาวน์โหลด
                </button>
                <button onClick={printQr}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
                  พิมพ์
                </button>
              </div>

              <div className="text-center text-xs text-slate-400">
                CODE: <span className="font-medium text-slate-600">{row.code}</span>
              </div>

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
                เคล็ดลับ: กด <kbd className="px-1 rounded bg-white border">Esc</kbd> เพื่อปิด •
                ขนาด QR จะปรับอัตโนมัติให้พอดีกับหน้าจอ
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
