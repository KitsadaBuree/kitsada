// src/app/register/page.jsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // รับเฉพาะตัวเลขและจำกัด 10 หลัก
  const onPhoneChange = (e) => {
    const v = e.target.value.replace(/[^\d]/g, "").slice(0, 10);
    setPhone(v);
  };

  // ✅ ต่ำสุด 6 ตัว
  const canSubmit = useMemo(() => {
    return name.trim() && email.trim() && pass.length >= 6 && phone.length <= 10;
  }, [name, email, pass, phone]);

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const emailNorm = email.trim().toLowerCase();

    if (!name.trim() || !emailNorm || !pass) {
      setErr("กรอกข้อมูลให้ครบ");
      return;
    }
    if (pass.length < 6) {
      setErr("รหัสผ่านต้องอย่างน้อย 6 ตัว");
      return;
    }
    if (phone && phone.length > 10) {
      setErr("เบอร์โทรต้องไม่เกิน 10 หลัก");
      return;
    }

    try {
      setSubmitting(true);
      setErr("");

      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone, email: emailNorm, password: pass }),
      });

      let j = {};
      try { j = await r.json(); } catch {}

      if (!r.ok || !j?.ok) {
        const msg =
          j?.error === "EMAIL_IN_USE"   ? "อีเมลนี้ถูกใช้งานแล้ว" :
          j?.error === "MISSING_FIELDS" ? "กรอกข้อมูลให้ครบ" :
          j?.error === "INVALID_EMAIL"  ? "อีเมลไม่ถูกต้อง" :
          j?.error === "WEAK_PASSWORD"  ? "รหัสผ่านต้องอย่างน้อย 6 ตัว" :
          j?.error || `REGISTER_FAILED (HTTP ${r.status})`;
        throw new Error(msg);
      }

      router.replace("/profile?registered=1");
    } catch (e2) {
      setErr(e2.message || "REGISTER_FAILED");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#FAFAFA] flex items-center justify-center px-5 py-10">
      <main className="w-full max-w-md">
        <div className="rounded-3xl bg-white border shadow-sm p-6 sm:p-8" style={{ borderColor: "#E9E9EB" }}>
          <h1 className="text-2xl font-bold text-center" style={{ color: "#1F3B2D" }}>สมัครสมาชิก</h1>
          <p className="text-center text-slate-500 mt-1">กรอกข้อมูลด้านล่างเพื่อสร้างบัญชีใหม่</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="block">
              <span className="sr-only">ชื่อ-นามสกุล</span>
              <input
                className="w-full h-12 rounded-2xl border px-4 outline-none placeholder:text-slate-400"
                style={{ borderColor: "#E9E9EB" }}
                placeholder="ชื่อ-นามสกุล"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="sr-only">เบอร์โทรศัพท์ (ไม่เกิน 10 ตัว)</span>
              <input
                className="w-full h-12 rounded-2xl border px-4 outline-none placeholder:text-slate-400"
                style={{ borderColor: "#E9E9EB" }}
                placeholder="เบอร์โทรศัพท์ (ไม่เกิน 10 ตัว)"
                value={phone}
                onChange={onPhoneChange}
                inputMode="numeric"
                maxLength={10}
              />
            </label>

            <label className="block">
              <span className="sr-only">อีเมล</span>
              <input
                className="w-full h-12 rounded-2xl border px-4 outline-none placeholder:text-slate-400"
                style={{ borderColor: "#E9E9EB" }}
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="sr-only">รหัสผ่าน</span>
              <input
                className="w-full h-12 rounded-2xl border px-4 outline-none placeholder:text-slate-400"
                style={{ borderColor: "#E9E9EB" }}
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </label>

            {!!err && (
              <div className="px-4 py-2 rounded-2xl text-sm" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="w-full h-12 rounded-2xl text-white font-semibold disabled:opacity-60"
              style={{ background: "#F4935E" }}
            >
              {submitting ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="w-full h-12 rounded-2xl border font-medium text-slate-700 active:scale-[0.99]"
              style={{ borderColor: "#E9E9EB" }}
            >
              มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
