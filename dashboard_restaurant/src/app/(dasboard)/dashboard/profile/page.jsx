"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Shield, Phone, Mail, User2, Eye, EyeOff, BadgeCheck } from "lucide-react";

const onlyDigits10 = (v="") => String(v).replace(/\D/g, "").slice(0, 10);

export default function KitchenProfilePage() {
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "" });
  const [pw, setPw] = useState({ new: "", confirm: "", showNew: false, showConfirm: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState({});

  const initial = useMemo(() => (form.name?.[0]?.toUpperCase() || "?"), [form.name]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/about", { cache: "no-store", credentials: "include" });
        const json = await res.json().catch(() => null);
        if (alive && json?.ok) {
          setMe(json.user);
          setForm({
            name: json.user.name || "",
            email: json.user.email || "",
            phone: json.user.phone || "",
            role: json.user.role || "",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  function setField(k, v) {
    setForm(s => ({ ...s, [k]: v }));
  }

  async function onSave(e) {
    e?.preventDefault();
    const _err = {};
    if (!form.name.trim()) _err.name = "กรุณากรอกชื่อ";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || "")) _err.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (form.phone && !/^\d{10}$/.test(form.phone)) _err.phone = "กรุณากรอกเบอร์ 10 หลัก";
    if (pw.new || pw.confirm) {
      if (pw.new.length < 6) _err.pwNew = "รหัสผ่านอย่างน้อย 6 ตัวอักษร";
      if (pw.new !== pw.confirm) _err.pwConfirm = "รหัสผ่านไม่ตรงกัน";
    }
    setErr(_err);
    if (Object.keys(_err).length) return;

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: onlyDigits10(form.phone),
          password: pw.new ? pw.new.trim() : "",
        }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) throw new Error(json?.error || "บันทึกไม่สำเร็จ");
      setMsg({ type: "ok", text: "บันทึกเรียบร้อย" });
      setPw({ new: "", confirm: "", showNew: false, showConfirm: false });
    } catch (e2) {
      setMsg({ type: "err", text: e2.message || "บันทึกไม่สำเร็จ" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* ★ หัวเรื่องมีไอคอน */}
      <div className="flex items-center gap-3">
        <BadgeCheck className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-semibold text-slate-900">ข้อมูลส่วนตัว</h1>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(2,6,23,0.06)]">
        {/* header */}
        <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* avatar */}
            <div className="grid size-14 place-items-center rounded-2xl bg-slate-900 text-white shadow-inner">
              <span className="text-xl font-bold">{initial}</span>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold tracking-tight text-slate-900">
                {form.name || (loading ? "กำลังโหลด…" : "-")}
              </div>
              {/* ★ แถบข้อมูลสั้น ๆ พร้อมไอคอน */}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                  <Shield className="h-3.5 w-3.5" />
                  {form.role ? form.role[0].toUpperCase() + form.role.slice(1) : "-"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                  <Mail className="h-3.5 w-3.5" />
                  {form.email || "-"}
                </span>
                {form.phone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    <Phone className="h-3.5 w-3.5" />
                    {form.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* body */}
        <form onSubmit={onSave} className="grid gap-5 p-6 md:grid-cols-2">
          {/* ★ Label ใส่ไอคอนนำหน้า */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <User2 className="h-4 w-4 text-slate-500" />
              ชื่อ-นามสกุล
            </label>
            <div className="relative">
              <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 pl-9 outline-none transition
                  ${err.name ? "border-rose-300 ring-4 ring-rose-100" : "border-slate-200 focus:ring-4 focus:ring-orange-200 focus:border-orange-400"}`}
                placeholder="ชื่อของคุณ"
              />
            </div>
            {err.name && <p className="mt-1 text-xs text-rose-600">{err.name}</p>}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail className="h-4 w-4 text-slate-500" />
              อีเมล
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={form.email}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Phone className="h-4 w-4 text-slate-500" />
              เบอร์โทร
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={form.phone || ""}
                onChange={(e) => setField("phone", onlyDigits10(e.target.value))}
                inputMode="numeric"
                maxLength={10}
                className={`w-full rounded-xl border px-3 py-2.5 pl-9 outline-none tabular-nums
                  ${err.phone ? "border-rose-300 ring-4 ring-rose-100" : "border-slate-200 focus:ring-4 focus:ring-orange-200 focus:border-orange-400"}`}
                placeholder="0812345678"
              />
            </div>
            {err.phone && <p className="mt-1 text-xs text-rose-600">{err.phone}</p>}
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Shield className="h-4 w-4 text-slate-500" />
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                type={pw.showNew ? "text" : "password"}
                value={pw.new}
                onChange={(e) => setPw(s => ({ ...s, new: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2.5 pr-10 outline-none
                ${err.pwNew ? "border-rose-300 ring-4 ring-rose-100" : "border-slate-200 focus:ring-4 focus:ring-orange-200 focus:border-orange-400"}`}
                placeholder="เว้นว่าง = ไม่เปลี่ยน"
              />
              {/* ★ ปุ่ม toggle ตา */}
              <button
                type="button"
                onClick={() => setPw(s => ({ ...s, showNew: !s.showNew }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-50"
                aria-label="toggle password"
              >
                {pw.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {err.pwNew && <p className="mt-1 text-xs text-rose-600">{err.pwNew}</p>}
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Shield className="h-4 w-4 text-slate-500" />
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={pw.showConfirm ? "text" : "password"}
                value={pw.confirm}
                onChange={(e) => setPw(s => ({ ...s, confirm: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2.5 pr-10 outline-none
                ${err.pwConfirm ? "border-rose-300 ring-4 ring-rose-100" : "border-slate-200 focus:ring-4 focus:ring-orange-200 focus:border-orange-400"}`}
                placeholder="กรอกรหัสผ่านเดิมอีกครั้ง"
              />
              <button
                type="button"
                onClick={() => setPw(s => ({ ...s, showConfirm: !s.showConfirm }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-50"
                aria-label="toggle password"
              >
                {pw.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {err.pwConfirm && <p className="mt-1 text-xs text-rose-600">{err.pwConfirm}</p>}
          </div>

          {/* footer */}
          <div className="md:col-span-2 mt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
