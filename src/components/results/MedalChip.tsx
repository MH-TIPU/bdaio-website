const STYLES: Record<string, string> = {
  GOLD: "bg-yellow-50 text-yellow-800 ring-yellow-300",
  SILVER: "bg-slate-100 text-slate-700 ring-slate-300",
  BRONZE: "bg-orange-50 text-orange-800 ring-orange-300",
  HONOURABLE_MENTION: "bg-blue-50 text-blue-700 ring-blue-200",
};

const LABELS: Record<string, string> = {
  GOLD: "Gold",
  SILVER: "Silver",
  BRONZE: "Bronze",
  HONOURABLE_MENTION: "Honourable Mention",
};

export const MEDAL_OPTIONS = [
  ["", "—"],
  ["GOLD", "Gold"],
  ["SILVER", "Silver"],
  ["BRONZE", "Bronze"],
  ["HONOURABLE_MENTION", "Honourable Mention"],
] as const;

export function MedalChip({ medal }: { medal: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STYLES[medal] ?? STYLES.HONOURABLE_MENTION}`}
    >
      🏅 {LABELS[medal] ?? medal}
    </span>
  );
}
