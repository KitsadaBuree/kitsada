// src/app/(dashboard)/layout.jsx   ← เช็กด้วยว่าสะกด (dashboard) ถูก
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "../../../lib/auth";
import Sidebar from "../../../components/sidebars/Sidebar";

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();                      // ✅ ต้อง await
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/login");
  try {
    await verifyAuthToken(token);
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="pl-64">{children}</main>
    </div>
  );
}
