// src/app/(kitchen)/layout.jsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import KitchenSidebar from "../../../components/kitchen/KitchenSidebar";

export const metadata = {
  title: "Kitchen Orders",
  description: "Orders WebApp Restaurant",
};

export default async function KitchenLayout({ children }) { // ต้องมี default export + children
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <KitchenSidebar />
      <main className="pl-64">{children}</main>
    </div>
  );
}
