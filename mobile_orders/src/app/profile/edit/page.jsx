// src/app/profile/edit/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/api/hooks/useAuth";
import { ArrowLeft, Save, KeyRound } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ first_name:"", last_name:"", phone:"" });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ old:"", next:"" });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/profile"); }, [loading, user, router]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/profile", { cache:"no-store" });
      const j = await r.json().catch(()=> ({}));
      if (j?.ok) {
        setForm({
          first_name: j.profile.first_name || "",
          last_name:  j.profile.last_name  || "",
          phone:      j.profile.phone      || "",
        });
      }
    })();
  }, []);

  async function saveProfile() {
    setSaving(true);
    await fetch("/api/profile", {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(form)
    });
    setSaving(false);
    router.back();
  }

  async function changePassword() {
    if (!pw.old || !pw.next) return;
    setSavingPw(true);
    await fetch("/api/profile/password", {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ old_password: pw.old, new_password: pw.next })
    });
    setSavingPw(false);
    setPw({ old:"", next:"" });
  }

  return (
    <div className="min-h-dvh bg-white">
      <header className="h-14 flex items-center px-2">
        <button onClick={() => router.back()} className="p-3 rounded-xl hover:bg-slate-100">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="mx-auto text-xl font-bold">แก้ไขข้อมูลส่วนตัว</h1>
        <div className="w-12" />
      </header>

      <main className="max-w-screen-sm mx-auto px-4 pb-10 space-y-5">
        <Section title="ข้อมูลติดต่อ">
          <Input label="ชื่อ" value={form.first_name} onChange={v=>setForm(s=>({...s, first_name:v}))} />
          <Input label="นามสกุล" value={form.last_name} onChange={v=>setForm(s=>({...s, last_name:v}))} />
          <Input label="เบอร์โทรศัพท์" value={form.phone} onChange={v=>setForm(s=>({...s, phone:v}))} inputMode="tel" />
          <button onClick={saveProfile} disabled={saving}
            className="h-12 rounded-2xl bg-[#F4935E] text-white font-semibold flex items-center justify-center gap-2 w-full">
            <Save className="w-5 h-5" /> {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </Section>

        <Section title="เปลี่ยนรหัสผ่าน">
          <Input label="รหัสผ่านเดิม" value={pw.old} onChange={v=>setPw(s=>({...s, old:v}))} type="password" />
          <Input label="รหัสผ่านใหม่" value={pw.next} onChange={v=>setPw(s=>({...s, next:v}))} type="password" />
          <button onClick={changePassword} disabled={savingPw}
            className="h-12 rounded-2xl border font-semibold flex items-center justify-center gap-2 w-full"
            style={{ borderColor:"#E9E9EB" }}>
            <KeyRound className="w-5 h-5" /> {savingPw ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
          </button>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor:"#E9E9EB" }}>
      <h2 className="font-semibold">{title}</h2>
      {children}
    </div>
  );
}
function Input({ label, value, onChange, type="text", inputMode }) {
  return (
    <label className="block">
      <span className="text-slate-500 text-sm">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e=>onChange(e.target.value)}
        inputMode={inputMode}
        className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2"
        style={{ borderColor:"#F2C2A9" }}
      />
    </label>
  );
}
