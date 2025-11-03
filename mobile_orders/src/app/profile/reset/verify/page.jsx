"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function VerifyOtpOnlyPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const uid = sp.get("uid") || "";
  const channel = sp.get("channel") || "email";
  const dest = sp.get("dest") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const destMask = useMemo(() => {
    if (!dest) return "";
    if (channel === "phone") {
      const t = dest.replace(/[^\d]/g, "");
      return t.replace(/^(\d{3})\d+(\d{2})$/, (_, a, b) => `${a}*****${b}`);
    } else {
      const [a, b = ""] = dest.split("@");
      if (a.length <= 2) return `**@${b}`;
      return `${a.slice(0, 2)}***@${b}`;
    }
  }, [dest, channel]);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setErr(""); setMsg("");

    if (!uid) {
      setErr("ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอรหัส OTP ใหม่");
      return;
    }
    if (!otp || otp.length < 6) {
      setErr("กรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, code: otp }),
      });
      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok) {
        // ทำเป็นตัวพิมพ์เล็กไว้แม็พง่าย ๆ
        const key = String(j?.error || "").toLowerCase();
        const map = {
          // รองรับทั้งสองชุดชื่อ error
          "otp_wrong": "รหัส OTP ไม่ถูกต้อง",
          "otp_invalid": "รหัส OTP ไม่ถูกต้อง",
          "otp_expired": "รหัส OTP หมดอายุ",
          "otp_locked": "ใส่ผิดหลายครั้งเกินไป ลองใหม่ภายหลัง",
          "otp_not_found": "ยังไม่ได้ขอรหัส OTP หรือรหัสนี้ถูกยกเลิก",
          "otp_not_issued": "ยังไม่ได้ขอรหัส OTP",
          "otp_used": "รหัสนี้ถูกใช้งานแล้ว",
          "invalid_input": "ข้อมูลไม่ถูกต้อง",
        };
        throw new Error(map[key] || "ตรวจรหัสไม่สำเร็จ");
      }

      // อ่าน reset_token ให้ครอบคลุมทั้งสองฟอร์แมต
      const rt = j.data?.reset_token || j.reset_token;
      if (!rt) throw new Error("ไม่มี reset token กรุณาลองใหม่");

      setMsg("ยืนยันสำเร็จ");
      setTimeout(() => {
        router.replace(`/profile/reset/new?rt=${encodeURIComponent(rt)}`);
      }, 500);
    } catch (e2) {
      setErr(e2.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <header className="h-12 flex items-center px-2">
        <button
          onClick={() =>
            (history.length > 1 ? router.back() : router.push("/profile/reset"))
          }
          className="p-3 rounded-xl hover:bg-slate-100"
          aria-label="ย้อนกลับ"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
      </header>

      <main className="max-w-screen-sm mx-auto px-6 pb-10">
        <h1 className="text-2xl font-semibold text-center">ยืนยันรหัส OTP</h1>
        <p className="text-center text-slate-500 mt-2">
          เราได้ส่งรหัสไปทาง {channel === "phone" ? "เบอร์โทร" : "อีเมล"} {destMask}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-slate-600">รหัส OTP</span>
            <input
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
              }
              inputMode="numeric"
              className="mt-1 w-full h-12 rounded-2xl border px-4 outline-none"
              style={{ borderColor: "#E9E9EB" }}
              placeholder="6 หลัก"
              autoFocus
            />
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
            disabled={loading}
            className="w-full h-12 rounded-2xl text-white font-semibold disabled:opacity-60"
            style={{ background: "#F4935E" }}
          >
            {loading ? "กำลังยืนยัน..." : "ยืนยัน"}
          </button>
        </form>
      </main>
    </div>
  );
}
