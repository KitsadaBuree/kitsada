"use client";
import { Search, ChevronDown, ChevronUp, UserRound, Pencil } from "lucide-react";

// เพิ่ม employee ทั้งใน filter และ label
const ROLES = ["", "employee", "member", "kitchen", "manager"];
const roleLabel = {
  "": "ทั้งหมด",
  employee: "Employee",
  member: "Member",
  kitchen: "Kitchen",
  manager: "Manager",
};

function Pill({ variant = "default", children }) {
  const map = {
    employee: "bg-amber-50 text-amber-700 ring-amber-200",
    member:   "bg-violet-50 text-violet-700 ring-violet-200",
    kitchen:  "bg-sky-50 text-sky-700 ring-sky-200",
    manager:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
    default:  "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-medium ring-1 ${map[variant] || map.default}`}>
      {children}
    </span>
  );
}

export default function StaffTable({
  data = [],
  loading = false,
  q = "",
  role = "",
  sort,
  onChangeQuery,
  onChangeSort,
  onEdit,
}) {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="rounded-[22px] bg-white/90 backdrop-blur border border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70">
        {/* search */}
        <div className="relative w-full sm:w-[420px]">
          <input
            value={q}
            onChange={(e) => onChangeQuery?.({ q: e.target.value })}
            placeholder="ค้นหา: ชื่อ / อีเมล / เบอร์"
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400"
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        </div>

        {/* segmented role filter */}
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
          {ROLES.map((rv) => {
            const active = role === rv;
            return (
              <button
                key={rv || "all"}
                onClick={() => onChangeQuery?.({ role: rv })}
                className={`px-3.5 py-1.5 text-sm rounded-full transition
                ${active ? "bg-orange-500 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
              >
                {roleLabel[rv]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="hidden md:block">
        <div className="px-3 sm:px-4 md:px-6">
          <table className="w-full table-fixed">
            <colgroup>
              {[
                "w-[6%]",   // #
                "w-[28%]",  // พนักงาน
                "w-[35%]",  // อีเมล
                "w-[17%]",  // เบอร์โทร
                "w-[15%]",  // บทบาท
                "w-[140px]" // จัดการ
              ].map((cls, i) => <col key={i} className={cls} />)}
            </colgroup>

            <thead className="sticky top-0 z-10">
              <tr className="text-left text-slate-600 text-[15px] bg-slate-50/95 backdrop-blur border-y border-slate-200 [&>th]:px-6 [&>th]:py-3">
                <Th>#</Th>
                <Th sortable sort={sort} k="name" onChangeSort={onChangeSort}>พนักงาน</Th>
                <Th sortable sort={sort} k="email" onChangeSort={onChangeSort}>อีเมล</Th>
                <Th>เบอร์โทร</Th>
                <Th sortable sort={sort} k="role" onChangeSort={onChangeSort}>บทบาท</Th>
                <Th className="text-right pr-6">จัดการ</Th>
              </tr>
            </thead>

            <tbody className="text-slate-800 [&>tr>td]:px-6 [&>tr>td]:py-5">
              {loading && Array.from({ length: 6 }).map((_, i) => <SkRow key={i} />)}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    ไม่พบข้อมูลที่ตรงเงื่อนไข
                  </td>
                </tr>
              )}

              {!loading && rows.map((r, idx) => {
                const roleKey = (r.role || "").toLowerCase().trim();
                return (
                  <tr
                    key={r.id ?? idx}
                    className={`group border-b border-slate-200/60 transition
                               ${idx % 2 ? "bg-white" : "bg-slate-50/40"}
                               hover:bg-orange-50/40`}
                  >
                    {/* # */}
                    <td className="text-slate-500">{idx + 1}</td>

                    {/* พนักงาน */}
                    <td className="pr-4">
                      <div className="grid grid-cols-[46px_1fr] items-center gap-3">
                        <div className="-ml-2 h-11 w-11 rounded-full bg-white grid place-items-center ring-1 ring-slate-200 shadow-[0_2px_8px_rgba(2,6,23,0.06)]">
                          <UserRound className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="leading-tight">
                          <div className="font-semibold tracking-[.01em]">{r.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            ID: {r.employee_code || `ST${String(r.id ?? idx + 1).padStart(4, "0")}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* อีเมล */}
                    <td className="whitespace-nowrap overflow-hidden text-ellipsis">
                      <span className="text-slate-700">{r.email}</span>
                    </td>

                    {/* เบอร์โทร */}
                    <td className="whitespace-nowrap tabular-nums tracking-wide text-slate-700">
                      {r.phone || "-"}
                    </td>

                    {/* บทบาท */}
                    <td className="whitespace-nowrap">
                      <div className="min-w-[112px] flex justify-start">
                        <Pill variant={roleKey || "default"}>
                          {roleKey ? roleKey[0].toUpperCase() + roleKey.slice(1) : "-"}
                        </Pill>
                      </div>
                    </td>

                    {/* จัดการ */}
                    <td className="whitespace-nowrap pr-6">
                      <div className="flex justify-end">
                        <button
                          onClick={() => onEdit?.(r)}
                          className="inline-flex items-center gap-2 h-9 rounded-full border border-slate-200 px-4
                                     text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100
                                     shadow-sm transition"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="hidden xl:inline">แก้ไข</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-200 px-3">
        {rows.map((r, i) => {
          const roleKey = (r.role || "").toLowerCase().trim();
          return (
            <div key={r.id ?? i} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white grid place-items-center ring-1 ring-slate-200 shadow-[0_2px_8px_rgba(2,6,23,0.06)]">
                    <UserRound className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </div>
                </div>
                <Pill variant={roleKey || "default"}>
                  {roleKey ? roleKey[0].toUpperCase() + roleKey.slice(1) : "-"}
                </Pill>
              </div>
              <div className="mt-2 text-slate-700 text-sm">{r.phone || "-"}</div>
              <div className="mt-3">
                <button
                  onClick={() => onEdit?.(r)}
                  className="rounded-full border border-slate-200 px-4 h-9 text-slate-700 bg-white hover:bg-slate-50"
                >
                  แก้ไข
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
        <button
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ไปบนสุด
        </button>
      </div>
    </div>
  );
}

/* Helpers */
function Th({ children, sortable = false, sort, k, onChangeSort, className = "" }) {
  if (!sortable) return <th className={`px-6 py-3 ${className}`}>{children}</th>;
  const active = sort?.key === k;
  const Dir = sort?.dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th>
      <button
        className={`flex items-center gap-1 px-6 py-3 ${className} ${active ? "text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
        onClick={() => onChangeSort?.({ key: k, dir: active && sort.dir === "asc" ? "desc" : "asc" })}
      >
        {children} {active && <Dir className="h-4 w-4" />}
      </button>
    </th>
  );
}

function SkRow() {
  return (
    <tr className="border-b border-slate-200/60">
      {[6, 48, 64, 28, 40, 24].map((w, i) => (
        <td key={i} className="px-6 py-5">
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}
