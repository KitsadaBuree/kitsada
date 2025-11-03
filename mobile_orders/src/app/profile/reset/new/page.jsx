"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Check } from "lucide-react";

/* ---------- Wrapper to satisfy Next's CSR bailout rule ---------- */
export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">กำลังโหลด...</div>}>
      <ResetNewPasswordInner />
    </Suspense>
  );
}

/* ---------------------- Original page logic --------------------- */
function scorePassword(pw = "") {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4); // 0..4
}

function ResetNewPasswordInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const rt = sp.get("rt") || ""; // reset_token ที่ได้จาก verify-otp

  useEffect(() => {
    if (!rt) router.replace("/profile/reset");
  }, [rt, router]);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const strength = useMemo(() => scorePassword(pw), [pw]);
  const canSubmit = useMemo(
    () => !!rt && pw.length >= 6 && pw === pw2 && !loading,
    [rt, pw, pw2, loading]
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(""); setOk(""); setLoading(true);

    try {
      const r = await fetch("/api/auth/reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_token: rt, new_password: pw }),
      });
      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok) {
        const m = j?.error || "reset_failed";
        const map = {
          invalid_token: "ลิงก์ตั้งรหัสไม่ถูกต้อง",
          token_expired: "ลิงก์ตั้งรหัสหมดอายุ",
          bad_request: "ข้อมูลไม่ครบถ้วน",
        };
        throw new Error(map[m] || "ตั้งรหัสผ่านไม่สำเร็จ");
      }

      setOk("ตั้งรหัสผ่านเรียบร้อย");
      setTimeout(() => router.replace("/profile?reset=1"), 900);
    } catch (e) {
      setErr(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <header className="h-12 flex items-center px-2">
        <button
          onClick={() => (history.length > 1 ? router.back() : router.push("/profile/reset"))}
          className="p-3 rounded-xl hover:bg-slate-100"
          aria-label="ย้อนกลับ"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
      </header>

      <main className="max-w-screen-sm mx-auto px-6 pb-10">
        <h1 className="text-2xl font-semibold text-center">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-center text-slate-500 mt-2">
          โปรดกำหนดรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* new password */}
          <label className="block">
            <span className="text-slate-600">รหัสผ่านใหม่</span>
            <div className="mt-1 flex items-center gap-2 rounded-2xl border px-3" style={{ borderColor: "#E9E9EB" }}>
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full h-12 bg-transparent outline-none"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="p-2 rounded-lg hover:bg-slate-100">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </label>

          {/* strength meter */}
          <div className="px-1">
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${(strength / 4) * 100}%`,
                  background: strength >= 3 ? "#10B981" : strength === 2 ? "#F59E0B" : "#EF4444",
                }}
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {strength >= 3 ? "รหัสผ่านแข็งแรง" : strength === 2 ? "ปานกลาง" : "อ่อน"}
            </div>
          </div>

          {/* confirm */}
          <label className="block">
            <span className="text-slate-600">ยืนยันรหัสผ่านใหม่</span>
            <div className="mt-1 flex items-center gap-2 rounded-2xl border px-3" style={{ borderColor: "#E9E9EB" }}>
              <input
                type={showPw2 ? "text" : "password"}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className="w-full h-12 bg-transparent outline-none"
                placeholder="พิมพ์ซ้ำอีกครั้ง"
              />
              <button type="button" onClick={() => setShowPw2(v => !v)} className="p-2 rounded-lg hover:bg-slate-100">
                {showPw2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {pw2 && pw !== pw2 && <div className="text-rose-600 text-sm mt-2">รหัสผ่านยืนยันไม่ตรงกัน</div>}
          </label>

          {!!ok && (
            <div className="px-4 py-2 rounded-xl text-sm" style={{ background: "#ECFDF5", color: "#065F46" }}>
              <span className="inline-flex items-center gap-2">
                <Check className="w-4 h-4" /> {ok}
              </span>
            </div>
          )}
          {!!err && (
            <div className="px-4 py-2 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 rounded-2xl text-white font-semibold disabled:opacity-60"
            style={{ background: "#F4935E" }}
          >
            {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="text-slate-600 underline underline-offset-4"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </main>
    </div>
  );
}
