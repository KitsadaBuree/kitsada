"use client";
import { useEffect, useMemo, useState } from "react";
import { X, Eye, EyeOff, UserRound, Trash2 } from "lucide-react";

const ROLES = [
  { key: "member",  label: "Member"  },
  { key: "kitchen", label: "Kitchen" },
  { key: "manager", label: "Manager" },
  { key: "employee", label: "Employee" },
];
function onlyDigits10(v = "") {
  return String(v).replace(/\D/g, "").slice(0, 10);
}

export default function StaffFormModal({
  open,
  editing,
  onClose,
  onSaved,
  onDelete, // optional callback; ถ้าไม่ส่งมาจะยิง API เอง
}) {
  const init = useMemo(() => ({
    name:  editing?.name  ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    role:  (editing?.role ?? "member").toLowerCase(),
    password: "",
  }), [editing]);

  const [form, setForm] = useState(init);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false); // << เพิ่ม state ยืนยันลบ

  useEffect(() => {
    setForm(init);
    setErrors({});
    setShowPw(false);
    setConfirmDelete(false); // reset ทุกครั้งที่เปิดโมดอลใหม่
  }, [init, open]);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const canDelete = Boolean(editing?.id);

    
  async function handleSubmit(e) {
    e?.preventDefault();

    const err = {};
    if (!form.name.trim()) err.name = "กรุณากรอกชื่อ-นามสกุล";
    if (!form.email.trim()) err.email = "กรุณากรอกอีเมล";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!/^\d{10}$/.test(form.phone)) err.phone = "กรุณากรอกเบอร์มือถือ 10 หลัก";
    setErrors(err);
    if (Object.keys(err).length) return;

    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/staff/${editing.id}` : "/api/staff";

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: onlyDigits10(form.phone),
      role: form.role,
    };
    if (form.password.trim()) payload.password = form.password.trim();

    try {
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(()=>null);
      if (!json?.ok) throw new Error(json?.error || "บันทึกไม่สำเร็จ");
      onSaved?.();
      onClose?.();
    } catch (err) {
      alert(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  // ลบแบบมีขั้นตอนยืนยันใน UI
  async function handleDelete() {
    if (!canDelete || saving) return;

    // กดครั้งแรก -> แสดงปุ่มยืนยัน
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    // กดยืนยันแล้ว -> ลบจริง
    setSaving(true);
    try {
      if (onDelete) {
        await onDelete(editing.id);
      } else {
        const res = await fetch(`/api/staff/${editing.id}`, { method: "DELETE" });
        const json = await res.json().catch(()=>null);
        if (!json?.ok) throw new Error(json?.error || "ลบไม่สำเร็จ");
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      alert(err.message || "ลบไม่สำเร็จ");
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden"
        >
          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-orange-500 text-white grid place-items-center shadow">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold">
                {editing ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-white text-slate-500"
              aria-label="ปิด"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* body */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ชื่อ */}
              <div>
                <label className="block text-sm font-medium text-slate-700">ชื่อ-นามสกุล</label>
                <input
                  value={form.name}
                  onChange={(e)=>set("name", e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 outline-none
                    ${errors.name ? "border-rose-300 ring-4 ring-rose-100" : "border-slate-200 focus:ring-4 focus:ring-orange-200 focus:border-orange-400"}`}
                  placeholder="เช่น กอไก่ ใจดี"
                />
                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
              </div>

              {/* อีเมล */}
              <div>
                <label className="block text-sm font-medium text-slate-700">อีเมล</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e)=>set("email", e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 outline-none
                    ${errors.email ? "border-rose-300 ring-4 ring-rose-100" : "border-slate-200 focus:ring-4 focus:ring-orange-200 focus:border-orange-400"}`}
                  placeholder="name@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
              </div>

              {/* เบอร์โทร */}
              <div>
              <label className="block text-sm font-medium text-slate-700">เบอร์โทร</label>
                <input
                  value={form.phone}
                  onChange={(e)=> set("phone", onlyDigits10(e.target.value))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 outline-none tabular-nums
                    ${errors.phone ? "border-rose-300 ring-4 ring-rose-100" : "border-slate-200 focus:ring-4 focus:ring-orange-200 focus:border-orange-400"}`}
                  placeholder="0812345678"
                />
                {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
              </div>

              {/* บทบาท */}
              <div>
                <label className="block text-sm font-medium text-slate-700">บทบาท</label>

                {/* ใช้ flex-wrap + gap */}
                <div className="mt-1 grid grid-cols-2 gap-2 md:flex md:flex-wrap">
                  {ROLES.map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => set("role", r.key)}
                      className={[
                        // ให้ปุ่มยืดครึ่งแถวบนจอเล็ก และกลับเป็นขนาดอิสระบนจอกลางขึ้นไป
                        "h-10 rounded-full border text-sm px-4 transition",
                        "flex-1 min-w-[120px] sm:flex-none",

                        form.role === r.key
                          ? "bg-orange-500 border-orange-500 text-white shadow"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>


              {/* รหัสผ่าน */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  รหัสผ่าน <span className="text-slate-400 font-normal">(เว้นว่าง = ไม่เปลี่ยน)</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e)=>set("password", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-11 outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={()=>setShowPw(v=>!v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-50"
                    aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-white">
            {/* ซ้าย: ลบ / ยืนยันลบ */}
            {canDelete ? (
              !confirmDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-60"
                >
                  <Trash2 className="h-5 w-5" />
                  ลบ
                </button>
              ) : (
                <div className="inline-flex items-center gap-2">
                  <span className="text-rose-700 font-medium">ยืนยันการลบ?</span>
                  <button
                    type="button"
                    onClick={()=>setConfirmDelete(false)}
                    disabled={saving}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="h-9 px-3 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    ยืนยันลบ
                  </button>
                </div>
              )
            ) : <span />}

            {/* ขวา: ยกเลิก/บันทึก */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-xl border border-slate-200 px-4 text-slate-700 hover:bg-slate-50"
                disabled={saving}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-xl bg-orange-500 px-5 font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
