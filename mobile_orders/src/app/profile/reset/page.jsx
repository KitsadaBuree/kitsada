// src/app/profile/reset/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";

export default function RequestResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setMsg(""); setErr(""); setLoading(true);

    try {
      const r = await fetch("/api/auth/forgot-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || "request_failed");

      // ไปหน้ากรอก OTP (channel = email เสมอ)
      const uid = j.uid || "";
      const q = new URLSearchParams({
        uid,
        channel: "email",
        dest: email.trim(),
      }).toString();

      router.replace(`/profile/reset/verify?${q}`);
    } catch {
      setErr("ขอรหัส OTP ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!email && email.includes("@");

  return (
    <div className="min-h-dvh bg-white">
      <header className="h-12 flex items-center px-2">
        <button
          onClick={() => (history.length > 1 ? router.back() : router.push("/profile"))}
          className="p-3 rounded-xl hover:bg-slate-100"
          aria-label="ย้อนกลับ"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
      </header>

      <main className="max-w-screen-sm mx-auto px-6 pb-10">
        <h1 className="text-2xl font-semibold text-center">ลืมรหัสผ่าน</h1>
        <p className="text-center text-slate-500 mt-2">
          กรอกอีเมลเพื่อขอรหัส OTP
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div
              className="flex items-center gap-2 rounded-2xl border px-4 py-3 focus-within:ring-2 focus-within:ring-[#F4935E]"
              style={{ borderColor: "#E9E9EB" }}
            >
              <Mail className="w-5 h-5 text-slate-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="อีเมล"
                className="w-full bg-transparent outline-none"
                autoComplete="email"
                required
              />
            </div>
          </label>

          {!!msg && (
            <div
              className="px-4 py-2 rounded-xl text-sm"
              style={{ background: "#ECFDF5", color: "#065F46" }}
            >
              {msg}
            </div>
          )}
          {!!err && (
            <div
              className="px-4 py-2 rounded-xl text-sm"
              style={{ background: "#FEF2F2", color: "#B91C1C" }}
            >
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full h-12 rounded-2xl text-white font-semibold disabled:opacity-60"
            style={{ background: "#F4935E" }}
          >
            {loading ? "กำลังส่ง OTP..." : "ขอรหัส OTP"}
          </button>
        </form>
      </main>
    </div>
  );
}
