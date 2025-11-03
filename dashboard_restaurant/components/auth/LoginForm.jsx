"use client";
import { useState } from "react";
import TextField from "./TextField";
import { UserRound, Lock } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "เข้าสู่ระบบไม่สำเร็จ");
      window.location.href = data.next;
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <TextField
        label="email"
        type="email"
        placeholder="email"
        icon={UserRound}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        helper="กรอกอีเมลเพื่อเข้าระบบ"
      />

      <TextField
        label="Password"
        type="password"
        placeholder="••••••••"
        icon={Lock}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        className="mt-2 h-12 rounded-2xl bg-[#77A9AD] text-white font-semibold tracking-wide
                   shadow-[0_10px_24px_-12px_rgba(119,169,173,0.8)]
                   hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-[#77A9AD]/30
                   disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "กำลังเข้าสู่ระบบ..." : "LOGIN"}
      </button>
    </form>
  );
}
