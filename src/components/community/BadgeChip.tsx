const STYLES: Record<string, string> = {
  VERIFIED_STUDENT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VOLUNTEER: "bg-blue-50 text-blue-700 ring-blue-200",
  MENTOR: "bg-violet-50 text-violet-700 ring-violet-200",
  CONTRIBUTOR: "bg-amber-50 text-amber-800 ring-amber-200",
  MEDAL: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  PARTICIPATION: "bg-slate-50 text-slate-700 ring-slate-200",
};

const ICONS: Record<string, string> = {
  VERIFIED_STUDENT: "✓",
  VOLUNTEER: "★",
  MENTOR: "◆",
  CONTRIBUTOR: "✎",
  MEDAL: "🏅",
  PARTICIPATION: "•",
};

export function BadgeChip({ type, title }: { type: string; title: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STYLES[type] ?? STYLES.PARTICIPATION}`}
    >
      <span aria-hidden="true">{ICONS[type] ?? "•"}</span>
      {title}
    </span>
  );
}
