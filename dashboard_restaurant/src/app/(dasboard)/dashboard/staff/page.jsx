// src/app/staff/page.jsx
import StaffClient from "../../../../../components/staff/StaffClient";
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  // searchParams เป็น async getter -> ต้อง await ก่อน แล้วจะได้เป็น object
  const sp = await searchParams;

  // helper คืนค่าเป็นสตริงตัวแรกเสมอ รองรับกรณีเป็น array/undefined
  const pick = (key, def = "") => {
    const v = sp?.[key];
    return Array.isArray(v) ? (v[0] ?? def) : (v ?? def);
  };

  const init = {
    q: pick("q", ""),
    role: pick("role", ""),
    page: Number(pick("page", "1")) || 1,
    pageSize: Number(pick("pageSize", "10")) || 10,
    sort: pick("sort", "id:desc"),
  };

  return <StaffClient initialQuery={init} />;
}
