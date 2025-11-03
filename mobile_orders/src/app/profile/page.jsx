// src/app/profile/page.jsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import useAuth from "../api/hooks/useAuth";

export default function ProfilePage() {
  const router = useRouter();
  const q = useSearchParams();
  const justRegistered = q.get("registered") === "1";
  const next = q.get("next") || "/";

  const { user, loading, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // ถ้าล็อกอินอยู่แล้ว → ไปหน้าที่กำหนด
  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  const errorText = useMemo(() => {
    if (!err) return "";
    if (err === "INVALID_CREDENTIALS") return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    if (err === "LOGIN_FAILED") return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่";
    return err;
  }, [err]);

  async function onLogin(e) {
    e.preventDefault();
    if (submitting) return;
    setErr("");
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password: pass }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || "LOGIN_FAILED");
      await refresh();
      router.replace(next); // ← ไปปลายทางที่ตั้งใจ
    } catch (e2) {
      setErr(e2.message || "LOGIN_FAILED");
    } finally {
      setSubmitting(false);
    }
  }

  const onBack = () => {
    router.replace("/");   // ใช้ replace เพื่อลบหน้าปัจจุบันออกจาก history
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <header className="h-12 flex items-center">
        <button onClick={onBack} className="p-3 rounded-xl hover:bg-slate-100 active:scale-95" aria-label="ย้อนกลับ">
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
      </header>

      <div className="px-20">
        <div className="relative mx-auto w-full max-w-[560px] aspect-[1.2/1]">
          <Image
            src="/restaurant.png"
            alt="Restaurant"
            fill
            className="object-contain"
            priority
            sizes="(max-width: 640px) 90vw, (max-width:1024px) 70vw, 560px"
          />
        </div>
      </div>

      {!loading && !user && (
        <form onSubmit={onLogin} className="mt-6 px-6 flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center">เข้าสู่ระบบด้วยอีเมล</h1>

          {justRegistered && (
            <div className="px-4 py-2 rounded-xl text-sm" style={{ background: "#ECFDF5", color: "#065F46" }}>
              สมัครสมาชิกสำเร็จแล้ว กรุณาเข้าสู่ระบบ
            </div>
          )}

          <label className="block">
            <span className="sr-only">อีเมล</span>
            <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-slate-700 focus-within:ring-2 focus-within:ring-[#F4935E]" style={{ borderColor: "#F2C2A9" }}>
              <Mail className="w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="อีเมล"
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">รหัสผ่าน</span>
            <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-slate-700 focus-within:ring-2 focus-within:ring-[#F4935E]" style={{ borderColor: "#F2C2A9" }}>
              <Lock className="w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="รหัสผ่าน"
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
                required
                autoComplete="current-password"
              />
            </div>
          </label>

          {!!errorText && (
            <div className="px-4 py-2 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
              {errorText}
            </div>
          )}
          {/* ... เหนือปุ่มเข้าสู่ระบบ */}
            <div className="flex justify-end -mt-2">
              <a href="/profile/reset" className="text-sm text-[#F4935E] hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>
          <button type="submit" disabled={submitting} className="mt-2 h-14 rounded-2xl text-white text-lg font-semibold disabled:opacity-60" style={{ background: "#9A9A9A" }}>
            {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/register")}
            className="h-12 rounded-2xl border font-medium text-slate-700 active:scale-[0.99] mt-2"
            style={{ borderColor: "#E9E9EB" }}
          >
            สมัครสมาชิก
          </button>
        </form>
      )}
    </div>
  );
}
