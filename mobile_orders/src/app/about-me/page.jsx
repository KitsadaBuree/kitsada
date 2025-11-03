// src/app/about-me/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, LogOut, ReceiptText, Pencil, Check, X, EyeOff, Eye, ChevronRight,
} from "lucide-react";

const fmtTHB = (n) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(n || 0));
const fmtThaiDate = (iso) =>
  new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(new Date(iso || Date.now()));

export default function AboutMePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // edit/profile state
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // password state
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");

  // orders sheet
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  // toast
  const [toast, setToast] = useState(null); // {message, type}
  function showToast(message, type = "success", ms = 2200) {
    setToast({ message, type });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), ms);
  }

  // ====== Safe Back ======
  const fallbackUrl = (() => {
    if (typeof window === "undefined") return "/";
    const t = localStorage.getItem("table_name");
    return t ? `/?table=${encodeURIComponent(t)}` : "/";
  })();
  function canGoBack() {
    if (typeof window === "undefined") return false;
    return !!(window.history.state && window.history.state.idx > 0);
  }
  function handleSafeBack(e) {
    if (canGoBack()) {
      e.preventDefault();
      router.back();
    }
  }

  // --- load real profile ---
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/profile", { credentials: "include" });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.ok) {
          router.replace("/profile");
          return;
        }
        if (!alive) return;
        setProfile(j.profile);
        setName(j.profile?.name || "");
        setPhone(j.profile?.phone || "");
        setEmail(j.profile?.email || "");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [router]);

  // --- save real profile ---
  async function saveProfile() {
    try {
      setSaving(true);
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // อีเมลไม่ให้แก้ -> ไม่ต้องส่งไป
        body: JSON.stringify({ name, phone }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setProfile(j.profile || { ...profile, name, phone });
      setEdit(false);
      showToast("บันทึกข้อมูลเรียบร้อย", "success");
    } catch (e) {
      showToast(e.message || "บันทึกไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
    }
  }

  // --- change real password ---
  async function savePassword() {
    if (!edit) return; // ต้องอยู่โหมดแก้ไขก่อน
    setPwError("");
    if (!pw.current || !pw.next || !pw.confirm) {
      setPwError("กรอกข้อมูลให้ครบ");
      showToast("กรอกข้อมูลให้ครบ", "error");
      return;
    }
    if (pw.next.length < 6) {
      setPwError("รหัสผ่านใหม่อย่างน้อย 6 ตัว");
      showToast("รหัสผ่านใหม่อย่างน้อย 6 ตัว", "error");
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError("รหัสผ่านใหม่ไม่ตรงกัน");
      showToast("รหัสผ่านใหม่ไม่ตรงกัน", "error");
      return;
    }
    try {
      setSavingPw(true);
      const r = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ current_password: pw.current, new_password: pw.next }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setPw({ current: "", next: "", confirm: "" });
      showToast("เปลี่ยนรหัสผ่านสำเร็จ", "success");
    } catch (e) {
      setPwError(e.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      showToast(e.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ", "error");
    } finally {
      setSavingPw(false);
    }
  }

  // --- logout real ---
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    router.replace(fallbackUrl);
  }

  // --- open orders (real) ---
  async function openOrders() {
    setOrdersOpen(true);
    setOrdersLoading(true);
    try {
      let r = await fetch("/api/my-orders?limit=200", { credentials: "include" });
      let j;
      try { j = await r.json(); } catch { j = {}; }
      if (!r.ok || !j?.ok) {
        r = await fetch("/api/orders?mine=1&limit=200", { credentials: "include" });
        j = await r.json();
        if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setOrders(j.data || []);
      } else {
        setOrders(j.data || []);
      }
    } catch (e) {
      showToast(e.message || "โหลดประวัติไม่สำเร็จ", "error");
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    if (!ordersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [ordersOpen]);

  const orderGroups = useMemo(() => {
    const m = new Map();
    for (const o of orders) {
      const key = fmtThaiDate(o.created_at);
      const arr = m.get(key) || [];
      arr.push(o); m.set(key, arr);
    }
    return Array.from(m.entries());
  }, [orders]);

  // ===== Receipt Detail sheet =====
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  async function openReceipt(code) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const r = await fetch(`/api/orders/${encodeURIComponent(code)}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      const data = j.data || j;
      setDetail(data);
    } catch (e) {
      showToast(e.message || "โหลดใบเสร็จไม่สำเร็จ", "error");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading || !profile) return null;

  return (
    <div className="min-h-dvh bg-[#FAFAFA]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white border-b" style={{ borderColor: "#E9E9EB" }}>
        <div className="relative h-14 max-w-screen-sm mx-auto flex items-center justify-center px-3">
          <a
            href={fallbackUrl}
            onClick={handleSafeBack}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-slate-100 z-10"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-6 h-6 text-slate-800" />
          </a>
          <h1 className="text-[28px] font-bold text-center pointer-events-none" style={{ color: "#1F3B2D" }}>
            About Me
          </h1>
        </div>
      </header>

      <main className="max-w-screen-sm mx-auto px-4 pb-24">
        {/* คะแนน + ชื่อ */}
        <section className="mt-4 rounded-3xl bg-white border shadow-sm overflow-hidden" style={{ borderColor: "#E9E9EB" }}>
          <div className="px-6 pt-6 pb-5 text-center">
            <div className="text-[22px] font-bold" style={{ color: "#2F6B3E" }}>{profile.name}</div>
            <div className="text-slate-400 mt-1">พอยท์สะสมทั้งหมด</div>
            <div className="text-[64px] leading-none font-extrabold mt-1" style={{ color: "#F4935E" }}>
              {profile.points ?? 0}
            </div>
            <div className="text-slate-400 -mt-1">คะแนน</div>
          </div>
          <div className="h-2" style={{ background: "#F4935E" }} />
        </section>

        {/* ข้อมูลส่วนตัว */}
        <div className="mt-4 space-y-4">
          <FieldBlock label="ชื่อผู้ใช้" value={name} onChange={(v) => setName(v)} editable={edit} />
          <FieldBlock label="ID" value={profile.id} readOnly />
          <div className="text-slate-400 text-sm -mb-2">บัญชีที่เข้าสู่ระบบ</div>

          {/* เบอร์โทร: ตัวเลขล้วน สูงสุด 10 หลัก */}
          <FieldBlock
            label="เบอร์โทร"
            value={phone}
            onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
            editable={edit}
            inputProps={{ inputMode: "numeric", maxLength: 10 }}
          />

          {/* อีเมล: แก้ไม่ได้ */}
          <FieldBlock label="อีเมล" value={email} readOnly />

          {/* password */}
          <div className="rounded-2xl bg-white border" style={{ borderColor: "#E9E9EB" }}>
            <LabelBar text="รหัสผ่าน" />
            <div className="px-5 pb-4">
              <div className="flex gap-2">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                  placeholder="รหัสผ่านปัจจุบัน"
                  className="flex-1 h-11 rounded-xl border px-3 outline-none disabled:opacity-50"
                  style={{ borderColor: "#E9E9EB" }}
                  disabled={!edit}
                />
                <button
                  onClick={() => setShowPw((s) => !s)}
                  className="px-3 rounded-xl border disabled:opacity-50"
                  style={{ borderColor: "#E9E9EB" }}
                  disabled={!edit}
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  placeholder="รหัสผ่านใหม่"
                  className="h-11 rounded-xl border px-3 outline-none disabled:opacity-50"
                  style={{ borderColor: "#E9E9EB" }}
                  disabled={!edit}
                />
                <input
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  className="h-11 rounded-xl border px-3 outline-none disabled:opacity-50"
                  style={{ borderColor: "#E9E9EB" }}
                  disabled={!edit}
                />
              </div>
              {pwError && <p className="text-rose-600 text-sm mt-2">{pwError}</p>}
              <button
                onClick={savePassword}
                disabled={savingPw || !edit}
                className="mt-3 w-full h-11 rounded-2xl text-white font-semibold disabled:opacity-60"
                style={{ background: "#F4935E" }}
              >
                {savingPw ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
              </button>
            </div>
          </div>

          {/* ปุ่มแก้ไข/บันทึก */}
          <div className="flex items-center justify-center mt-1">
            {!edit ? (
              <button
                onClick={() => setEdit(true)}
                className="px-5 h-10 rounded-full bg-[#FFE7D8] text-[#F4935E] font-semibold flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" /> แก้ไขข้อมูล
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEdit(false);
                    setName(profile.name || "");
                    setPhone(profile.phone || "");
                    setEmail(profile.email || "");
                  }}
                  className="px-5 h-10 rounded-full border text-slate-700 flex items-center gap-2"
                  style={{ borderColor: "#E9E9EB" }}
                >
                  <X className="w-4 h-4" /> ยกเลิก
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-5 h-10 rounded-full text-white flex items-center gap-2 disabled:opacity-60"
                  style={{ background: "#F4935E" }}
                >
                  <Check className="w-4 h-4" /> {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ประวัติการสั่งซื้อ */}
        <button
          onClick={openOrders}
          className="mt-6 w-full rounded-2xl bg-[#F4935E] text-white py-4 px-5 flex items-center justify-between shadow-sm active:translate-y-[0.5px]"
        >
          <div className="flex items-center gap-3">
            <ReceiptText className="w-6 h-6" />
            <span className="text-[18px] font-semibold">ประวัติการสั่งซื้อ</span>
          </div>
          <ChevronRight className="w-6 h-6 opacity-80" />
        </button>

        {/* ออกจากระบบ */}
        <button
          onClick={logout}
          className="mt-3 w-full rounded-2xl border-2 py-4 px-5 text-[#D84A2B] font-semibold flex items-center justify-center gap-2 active:translate-y-[0.5px]"
          style={{ borderColor: "#FAD3C9" }}
        >
          <LogOut className="w-6 h-6" />
          ออกจากระบบ
        </button>
      </main>

      {/* Sheet: Orders */}
      <Sheet open={ordersOpen} onClose={() => setOrdersOpen(false)} title="ประวัติการสั่งซื้อ">
        <div className="px-5 pb-6">
          {ordersLoading ? (
            <div className="text-center text-slate-500 py-10">กำลังโหลด...</div>
          ) : orders.length === 0 ? (
            <div className="text-center text-slate-500 py-10">ยังไม่มีรายการ</div>
          ) : (
            orderGroups.map(([dateLabel, list]) => (
              <section key={dateLabel} className="mb-4">
                <h4 className="text-slate-500 text-sm mb-2">{dateLabel}</h4>
                <div className="space-y-3">
                  {list.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-2xl bg-white border p-4 flex items-center justify-between"
                      style={{ borderColor: "#E9E9EB" }}
                    >
                      <div>
                        <div className="text-slate-900 font-semibold">รหัส: {o.order_code}</div>
                        <div className="text-slate-500 text-sm">
                          โต๊ะ {o.table_no ?? "-"} · ยอดสุทธิ {fmtTHB(o.total)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openReceipt(o.order_code)}
                        className="px-3 py-2 rounded-xl text-white text-sm"
                        style={{ background: "#F4935E" }}
                      >
                        ดู
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </Sheet>

      {/* Sheet: Receipt Detail */}
      <Sheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail?.order?.order_code ? `ใบเสร็จ: ${detail.order.order_code}` : "รายละเอียดใบเสร็จ"}
      >
        <div className="px-5 pb-6">
          {detailLoading ? (
            <div className="text-center text-slate-500 py-10">กำลังโหลด...</div>
          ) : !detail ? (
            <div className="text-center text-slate-500 py-10">ไม่พบข้อมูล</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#E9E9EB" }}>
                <div className="text-slate-900 font-semibold">โต๊ะ {detail.order?.table_no ?? "-"}</div>
                <div className="text-slate-500 text-sm">
                  ยอดสุทธิ {fmtTHB(detail.order?.total)}
                  {" · "}ค่าบริการ {fmtTHB(detail.order?.service_charge || 0)}
                  {Number(detail.order?.discount) > 0 && <>{" · "}ส่วนลด {fmtTHB(detail.order.discount)}</>}
                </div>
              </div>

              <div className="rounded-2xl border bg-white" style={{ borderColor: "#E9E9EB" }}>
                <div className="px-4 py-3 border-b text-slate-500" style={{ borderColor: "#E9E9EB" }}>
                  รายการอาหาร ({detail.items?.length || 0})
                </div>
                <div className="divide-y" style={{ borderColor: "#E9E9EB" }}>
                  {(detail.items || []).map((it, idx) => (
                    <div key={idx} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-[#F4935E]">{it.qty}x</span>
                        <span className="truncate">{it.name}</span>
                      </div>
                      <span className="text-slate-900">
                        {fmtTHB(Number(it.unit_price) * Number(it.qty))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 space-y-1 text-sm text-slate-500">
                  <div className="flex justify-between">
                    <span>รวมค่าอาหาร</span>
                    <span>{fmtTHB(detail.order?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ค่าบริการ</span>
                    <span>{fmtTHB(detail.order?.service_charge || 0)}</span>
                  </div>
                  {Number(detail.order?.discount) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>ส่วนลด</span>
                      <span>-{fmtTHB(detail.order.discount)}</span>
                    </div>
                  )}
                  <div className="h-px" style={{ background: "#E9E9EB" }} />
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-[#F4935E]">ราคารวมสุทธิ</span>
                    <span className="text-xl font-extrabold" style={{ color: "#E88452" }}>
                      {fmtTHB(detail.order?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Sheet>

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function FieldBlock({ label, value, onChange, readOnly = false, editable = false, inputProps = {} }) {
  return (
    <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: "#E9E9EB" }}>
      <LabelBar text={label} />
      <div className="px-5 py-3">
        {readOnly || !editable ? (
          <div className="text-[#F4935E] text-[18px]">{String(value || "-")}</div>
        ) : (
          <input
            {...inputProps}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full h-11 rounded-xl border px-3 outline-none text-slate-800"
            style={{ borderColor: "#E9E9EB" }}
          />
        )}
      </div>
    </div>
  );
}

function LabelBar({ text }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 bg-[#F6F6F6] border-b" style={{ borderColor: "#EFEFEF" }}>
      <div className="w-1.5 h-6 rounded-full" style={{ background: "#F4935E" }} />
      <span className="text-slate-500">{text}</span>
    </div>
  );
}

function Sheet({ open, onClose, title, children }) {
  return (
    <div className={`fixed inset-0 z-[90] ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl
                    max-h-[90dvh] w-full flex flex-col transition-transform
                    ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Toast({ type = "success", message = "", onClose }) {
  const palette =
    {
      success: { bg: "bg-emerald-600", ring: "ring-emerald-300" },
      error: { bg: "bg-rose-600", ring: "ring-rose-300" },
      info: { bg: "bg-slate-700", ring: "ring-slate-300" },
    }[type] || { bg: "bg-slate-700", ring: "ring-slate-300" };

  return (
    <div className="fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
      <div
        className={[
          "max-w-[520px] w-full sm:w-auto",
          "px-4 py-3 rounded-2xl text-white shadow-xl",
          "ring-1",
          palette.ring,
          palette.bg,
          "animate-[toastIn_0.18s_ease-out]",
        ].join(" ")}
        role="status"
        onClick={onClose}
      >
        <div className="text-center font-medium">{message}</div>
      </div>

      <style jsx>{`
        @keyframes toastIn {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);  opacity: 1; }
        }
      `}</style>
    </div>
  );
}
