// app/t/[code]/page.jsx
"use client";
import { use, useEffect } from "react";
import MenuShell from "../../../../components/MenuShell";
export default function TableLanding({ params }) {
  const { code } = use(params);

  useEffect(() => {
    if (!code) return;
    localStorage.setItem("table_code", code);

    // (ทางเลือก) resolve โต๊ะเพื่อเก็บ table_id/number/name
    (async () => {
      try {
        const r = await fetch(`/api/table?code=${encodeURIComponent(code)}`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j?.ok && j.data) {
          const t = j.data;
          if (t.id) localStorage.setItem("table_id", String(t.id));
          if (t.number) localStorage.setItem("table_no", String(t.number));
          if (t.name) localStorage.setItem("table_name", String(t.name));
        }
      } catch {}
    })();
  }, [code]);

  // ✅ แสดงหน้าเมนูเลย แต่ URL คงเป็น /t/{code}
  return <MenuShell />;
}
