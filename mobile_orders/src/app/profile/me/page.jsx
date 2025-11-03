// src/app/profile/me/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/api/hooks/useAuth";
import { ArrowLeft, LogOut, History } from "lucide-react";

export default function ProfileMePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/profile");
  }, [loading, user, router]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) return;
      const r = await fetch("/api/profile", { cache:"no-store" });
      const j = await r.json().catch(()=> ({}));
      if (alive && j?.ok) setProfile(j.profile);
    })();
    return () => { alive = false; };
  }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method:"POST" });
    router.replace("/profile");
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-dvh bg-[#F5F6F8]">
      <header className="h-14 flex items-center px-2">
        <button onClick={() => router.back()} className="p-3 rounded-xl hover:bg-slate-100">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="mx-auto text-xl font-bold">About Me</h1>
        <div className="w-12" />
      </header>

      <main className="max-w-screen-sm mx-auto px-4 pb-6">
        {/* คะแนน */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-center text-[#2E7D32] font-bold text-xl">
            {profile.first_name} {profile.last_name}
          </p>
          <p className="text-center text-slate-500">พอยท์สะสมทั้งหมด</p>
          <p className="text-center text-6xl font-extrabold text-[#F4935E] leading-tight mt-2">
            {profile.points}
          </p>
          <p className="text-center text-slate-500 -mt-2">คะแนน</p>
        </div>

        {/* ฟิลด์ข้อมูล */}
        <section className="mt-4 space-y-3">
          <InfoField label="ID" value={`${profile.id}`.padStart(8,"0")} />
          <InfoField label="เบอร์โทร" value={profile.phone || "-"} />
          <InfoField label="อีเมล" value={profile.email} />
          <InfoField label="ชื่อผู้ใช้" value={`${profile.first_name || ""} ${profile.last_name || ""}`.trim()} />
        </section>

        <div className="mt-4 grid gap-3">
          <button
            onClick={() => router.push("/profile/orders")}
            className="h-14 rounded-2xl bg-[#F4935E] text-white font-semibold flex items-center justify-center gap-2"
          >
            <History className="w-5 h-5" /> ประวัติการสั่งซื้อ
          </button>

          <button
            onClick={() => router.push("/profile/edit")}
            className="h-12 rounded-2xl border font-medium"
            style={{ borderColor:"#E9E9EB" }}
          >
            แก้ไขข้อมูล
          </button>

          <button
            onClick={logout}
            className="h-12 rounded-2xl border-2 text-rose-600 font-semibold flex items-center justify-center gap-2"
            style={{ borderColor:"#FECACA" }}
          >
            <LogOut className="w-5 h-5" /> ออกจากระบบ
          </button>
        </div>
      </main>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 border" style={{ borderColor:"#F2C2A9" }}>
      <p className="text-slate-400">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}
