export function badgeRole(role) {
  const map = {
    manager: { label: "Manager",  cls: "bg-emerald-500/15 text-emerald-300" },
    kitchen: { label: "Kitchen",   cls: "bg-sky-500/15 text-sky-300" },
    member:  { label: "Member",    cls: "bg-violet-500/15 text-violet-300" },
    customer:{ label: "Customer",  cls: "bg-white/10 text-white/70" },
  };
  const it = map[role] || { label: role || "—", cls: "bg-white/10 text-white/70" };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${it.cls}`}>
      {it.label}
    </span>
  );
}
