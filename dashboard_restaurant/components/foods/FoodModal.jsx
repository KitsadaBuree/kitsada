// components/foods/FoodModal.jsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Save, Upload, Loader2, Trash2, ImagePlus, AlertTriangle
} from "lucide-react";

/* ---------- utils ---------- */
async function safeJson(res) {
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    // ส่งทั้ง status และข้อความออกไปให้ mapping ภายหลัง
    const payload = (() => { try { return JSON.parse(text); } catch { return null; } })();
    const msg = payload?.error || text || res.statusText || "Request error";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  try { return JSON.parse(text); } catch { throw new Error("Bad JSON"); }
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* ---------- component ---------- */
export default function FoodModal({ data, onClose, onSaved, categories = [] }) {
  const item = data?.item || {};

  const [name, setName] = useState(item.name || "");
  const [price, setPrice] = useState(item.price != null ? String(item.price) : "0");
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? item.image_url ?? "");
  const [categoryId, setCategoryId] = useState(item.category_id != null ? String(item.category_id) : "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");     // error แถบล่าง
  const [nameError, setNameError] = useState("");     // error ใต้ช่องชื่อ (เช่นซ้ำ)
  const [priceError, setPriceError] = useState("");   // error ใต้ช่องราคา
  const [catError, setCatError] = useState("");       // error ใต้ช่องหมวด

  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    setName(item.name || "");
    setPrice(item.price != null ? String(item.price) : "0");
    setImageUrl(item.imageUrl ?? item.image_url ?? "");
    setCategoryId(item.category_id != null ? String(item.category_id) : "");
    setFormError(""); setNameError(""); setPriceError(""); setCatError("");
    // โฟกัสชื่อ
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [data?.mode, item?.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        !saving && save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, name, price, categoryId, imageUrl]);

  const uniqCategories = useMemo(() => {
    const map = new Map();
    for (const c of categories ?? []) {
      if (!c || c.id == null) continue;
      const k = String(c.id);
      if (!map.has(k)) map.set(k, { id: c.id, name: c.name ?? "", count: c.count ?? 0 });
    }
    return Array.from(map.values());
  }, [categories]);

  async function uploadToCloudinary(file) {
    const sign = await safeJson(
      await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "restaurant/products" }),
        cache: "no-store",
      })
    );
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", sign.apiKey);
    fd.append("timestamp", String(sign.timestamp));
    fd.append("signature", sign.signature);
    if (sign.folder) fd.append("folder", sign.folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`, {
      method: "POST", body: fd,
    });
    const json = await safeJson(res);
    return json.secure_url;
  }

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setFormError(""); setNameError(""); setPriceError(""); setCatError("");
    try {
      const url = await uploadToCloudinary(file);
      setImageUrl(url);
    } catch (e) {
      setFormError(e.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  function validate() {
    let ok = true;
    setFormError(""); setNameError(""); setPriceError(""); setCatError("");

    if (!name.trim()) {
      setNameError("กรอกชื่อรายการ"); ok = false;
    }
    if (categoryId === "") {
      setCatError("เลือกหมวดหมู่"); ok = false;
    }
    const nPrice = Number(price);
    if (Number.isNaN(nPrice) || nPrice < 0) {
      setPriceError("กรอกราคาให้ถูกต้อง"); ok = false;
    }
    return ok;
  }

  async function save() {
    if (!validate()) return;
    if (uploading) { setFormError("กำลังอัปโหลดรูปอยู่ กรุณารอให้เสร็จก่อน"); return; }

    const payload = {
      name: name.trim(),
      price: Number(price) || 0,
      image_url: imageUrl || null,
      category_id: categoryId !== "" ? Number(categoryId) : null,
    };

    const url = data?.mode === "edit" ? `/api/foods/${item.id}` : "/api/foods";
    const method = data?.mode === "edit" ? "PUT" : "POST";

    setSaving(true);
    try {
      const res = await safeJson(await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }));
      if (res.ok) onSaved?.();
      else setFormError(res.error || "บันทึกไม่สำเร็จ");
    } catch (e) {
      // map 409 → ข้อความสุภาพใต้ช่องชื่อ
      if (e.status === 409 || /มีเมนูนี้อยู่แล้ว/i.test(e.message)) {
        setNameError("มีเมนูนี้อยู่แล้ว");
      } else {
        setFormError(e.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="relative border-b">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_260px_at_-10%_-60%,rgba(253,88,0,.10),transparent_60%),radial-gradient(900px_220px_at_120%_120%,rgba(14,165,233,.10),transparent_60%)]" />
          <div className="relative flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-white shadow ring-1 ring-orange-400/60">
                <ImagePlus size={18} />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                {data?.mode === "edit" ? "แก้ไขรายการ" : "เพิ่มรายการ"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="ปิด"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {/* ชื่อ */}
          <label className="block">
            <div className="mb-1 text-sm text-slate-600">ชื่อ</div>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
              className={classNames(
                "w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2",
                nameError ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-orange-200"
              )}
              placeholder="เช่น ข้าวผัด"
            />
            {nameError && (
              <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle size={14} /> {nameError}
              </div>
            )}
          </label>

          {/* ราคา */}
          <label className="block">
            <div className="mb-1 text-sm text-slate-600">ราคา</div>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={price}
                min={0}
                onChange={(e) => { setPrice(e.target.value); setPriceError(""); }}
                className={classNames(
                  "w-full rounded-lg border bg-white px-3 py-2 pr-12 outline-none focus:ring-2",
                  priceError ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-orange-200"
                )}
                placeholder="0.00"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                บาท
              </span>
            </div>
            {priceError && (
              <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle size={14} /> {priceError}
              </div>
            )}
          </label>

          {/* หมวดหมู่ */}
          <label className="block md:col-span-2">
            <div className="mb-1 text-sm text-slate-600">หมวดหมู่</div>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setCatError(""); }}
              className={classNames(
                "w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2",
                catError ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-orange-200"
              )}
            >
              <option key="__empty" value="">— เลือกหมวดหมู่ —</option>
              {uniqCategories.length === 0 && (
                <option disabled>ยังไม่มีหมวดหมู่ (ไปเพิ่มที่เมนูหมวดหมู่ก่อน)</option>
              )}
              {uniqCategories.map((c) => (
                <option key={`cat-${c.id}`} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            {catError && (
              <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle size={14} /> {catError}
              </div>
            )}
          </label>

          {/* อัปโหลดรูป */}
          <div className="md:col-span-2">
            <div className="mb-1 text-sm text-slate-600">รูปภาพ</div>
            <div
              className={classNames(
                "group relative grid h-40 place-items-center rounded-xl border-2 border-dashed bg-slate-50/70",
                uploading ? "border-slate-300" : "border-slate-300/80 hover:border-orange-400/70 hover:bg-orange-50"
              )}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              onDragOver={(e) => e.preventDefault()}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-40 w-full rounded-xl object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-500">
                  <Upload size={18} />
                  <span className="text-sm">วางไฟล์ที่นี่ หรือ</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    เลือกไฟล์
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            <div className="mt-2 flex items-center justify-between">
              {uploading ? (
                <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="animate-spin" size={16} /> กำลังอัปโหลด…
                </div>
              ) : <div className="h-5" />}

              {imageUrl && !uploading && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                >
                  <Trash2 size={14} /> ลบรูป
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global error */}
        {formError && (
          <div className="mx-5 -mt-2 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {formError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            onClick={onClose}
            disabled={uploading || saving}
            className="rounded-lg border px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={save}
            disabled={uploading || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
