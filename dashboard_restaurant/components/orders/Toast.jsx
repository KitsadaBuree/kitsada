"use client";
import { useEffect, useState } from "react";

export default function Toast({ text = "", type = "success", show = false, onDone }) {
  const [visible, setVisible] = useState(show);
  useEffect(() => {
    setVisible(show);
    if (show) {
      const t = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 2400);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  if (!visible) return null;
  const tone =
    type === "error"
      ? "bg-rose-600"
      : type === "warn"
      ? "bg-amber-500"
      : "bg-emerald-600";

  return (
    <div className="fixed inset-x-0 bottom-6 z-[90] grid place-items-center px-4">
      <div className={`${tone} text-white rounded-xl px-4 py-2 text-sm shadow-lg animate-[toast_.18s_ease]`}>
        {text}
      </div>
      <style jsx global>{`
        @keyframes toast { from{transform:translateY(8px); opacity:0} to{transform:translateY(0); opacity:1} }
      `}</style>
    </div>
  );
}
