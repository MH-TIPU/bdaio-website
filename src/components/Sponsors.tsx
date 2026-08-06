import Image from "next/image";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/storage/uploads";
import { SPONSOR_TIERS, TIER_COLUMNS, TIER_LABELS } from "@/lib/sponsors";
import type { Locale } from "@/lib/i18n/config";
import type { SponsorTier } from "@/generated/prisma/enums";

/**
 * The sponsor sections on the home page, read from the database.
 *
 * These used to be hand-written JSX over a hard-coded map in `src/data/media.ts`
 * — every new sponsor was a deploy, and the tier a logo sat in was expressed by
 * which block of markup it happened to be pasted into. Now the tier is a column
 * and the layout is one loop, so adding a sponsor is a form.
 *
 * The trade is that the sections are uniform where the old markup was bespoke.
 * `TIER_COLUMNS` keeps the part of that bespoke-ness that carried meaning: the
 * organiser and headline sponsors still get more room than the long tail.
 */

type SponsorRow = {
  id: string;
  name: string;
  nameBn: string | null;
  url: string | null;
  logo: string | null;
  alt: string;
  width: number;
  height: number;
};

function SponsorLogo({ sponsor, locale }: { sponsor: SponsorRow; locale: Locale }) {
  const name = locale === "bn" && sponsor.nameBn ? sponsor.nameBn : sponsor.name;

  const inner = sponsor.logo ? (
    <div className="group relative flex h-20 w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md">
      <Image
        src={sponsor.logo}
        alt={sponsor.alt || `${name} logo`}
        width={sponsor.width}
        height={sponsor.height}
        sizes="(min-width: 640px) 200px, 45vw"
        className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  ) : (
    // No logo uploaded yet: the name is still the information, so show it rather
    // than an empty box or a broken image.
    <div
      className={`flex h-20 w-full items-center justify-center rounded-xl border border-slate-100 bg-white px-4 text-center text-xs font-bold text-slate-500 shadow-sm ${
        locale === "bn" && sponsor.nameBn ? "font-bengali" : ""
      }`}
    >
      {name}
    </div>
  );

  if (!sponsor.url) return inner;

  return (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-bdaio-blue/50"
    >
      {inner}
    </a>
  );
}

const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  5: "grid-cols-2 sm:grid-cols-5",
};

/** Roughly how wide a tier's block should be, so a single logo is not stretched. */
const WIDTH_CLASS: Record<number, string> = {
  1: "max-w-xs",
  2: "max-w-md",
  3: "max-w-xl",
  5: "max-w-4xl",
};

export async function SponsorsSection({ locale }: { locale: Locale }) {
  const sponsors = await db.sponsor.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { asset: { select: { filename: true, alt: true, width: true, height: true } } },
  });

  if (sponsors.length === 0) return null;

  const byTier = new Map<SponsorTier, SponsorRow[]>();
  for (const sponsor of sponsors) {
    const list = byTier.get(sponsor.tier) ?? [];
    list.push({
      id: sponsor.id,
      name: sponsor.name,
      nameBn: sponsor.nameBn,
      url: sponsor.url,
      logo: sponsor.asset ? mediaUrl(sponsor.asset.filename) : null,
      alt: sponsor.asset?.alt ?? "",
      width: sponsor.asset?.width ?? 200,
      height: sponsor.asset?.height ?? 80,
    });
    byTier.set(sponsor.tier, list);
  }

  return (
    <section className="bg-slate-50/70 py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-[#1e5a8a]">Official Sponsors &amp; Partners</h2>
          <p className="mt-2 text-slate-500">Supporting the AI talent of Bangladesh</p>
        </div>

        {SPONSOR_TIERS.map((tier) => {
          const rows = byTier.get(tier);
          if (!rows?.length) return null;
          const columns = TIER_COLUMNS[tier];

          return (
            <div key={tier} className={`mx-auto text-center ${WIDTH_CLASS[columns] ?? "max-w-4xl"}`}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-bdaio-blue">
                {TIER_LABELS[tier]}
              </h3>
              <div className={`grid gap-4 ${COLUMN_CLASS[columns] ?? "grid-cols-3"}`}>
                {rows.map((sponsor) => (
                  <SponsorLogo key={sponsor.id} sponsor={sponsor} locale={locale} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
