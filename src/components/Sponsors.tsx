import Image from "next/image";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/storage/uploads";
import { SPONSOR_TIERS, TIER_LABELS, TIER_SIZE, type TierSize } from "@/lib/sponsors";
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
 * The trade is that the tiers are uniform where the old markup was bespoke.
 * `TIER_SIZE` keeps the part of that bespoke-ness that carried meaning: the
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

/**
 * How much room one logo gets. The card around it belongs to the tier, so these
 * are the dimensions of the artwork alone.
 *
 * Both axes are fixed so every logo in a tier occupies the same footprint —
 * artwork is landscape, square and portrait by turns, and sizing on height
 * alone would leave a wide wordmark dwarfing the square logo beside it.
 */
const BOX_CLASS: Record<TierSize, string> = {
  xl: "h-16 w-40",
  lg: "h-14 w-32",
  md: "h-12 w-28",
  sm: "h-10 w-24",
  xs: "h-9 w-20",
};

function SponsorLogo({
  sponsor,
  locale,
  size,
}: {
  sponsor: SponsorRow;
  locale: Locale;
  size: TierSize;
}) {
  const name = locale === "bn" && sponsor.nameBn ? sponsor.nameBn : sponsor.name;
  const box = BOX_CLASS[size];

  const inner = sponsor.logo ? (
    <div className={`flex items-center justify-center ${box}`}>
      <Image
        src={sponsor.logo}
        alt={sponsor.alt || `${name} logo`}
        width={sponsor.width}
        height={sponsor.height}
        sizes="160px"
        className="max-h-full w-auto object-contain transition-transform duration-300 hover:scale-105"
      />
    </div>
  ) : (
    // No logo uploaded yet: the name is still the information, so show it rather
    // than an empty box or a broken image.
    <div
      className={`flex items-center justify-center text-center text-xs font-bold text-slate-500 ${box} ${
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
      className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-bdaio-blue/50"
    >
      {inner}
    </a>
  );
}

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
    <section className="bg-slate-50/70 py-14 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-bdaio-blue-dark">
            Official Sponsors &amp; Partners
          </h2>
          <p className="mt-2 text-slate-500">Supporting the AI talent of Bangladesh</p>
        </div>

        {/*
          One card per tier, and the tiers on one wrapping line.

          Before: eleven tiers stacked as eleven full-width rows, each logo in a
          card of its own — the section ran for several screens, and three
          partners read as three unrelated things rather than one group. The card
          is now the tier, which is what the grouping actually is, and the tiers
          flow together. `TIER_SIZE` carries the hierarchy that the
          row-per-tier layout used to carry by position.
        */}
        <div className="mt-8 flex flex-wrap items-stretch justify-center gap-3.5">
          {SPONSOR_TIERS.map((tier) => {
            const rows = byTier.get(tier);
            if (!rows?.length) return null;

            return (
              <div
                key={tier}
                className="flex flex-col rounded-xl bg-white px-4 py-3.5 text-center shadow-sm ring-1 ring-slate-200/70"
              >
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-bdaio-blue">
                  {TIER_LABELS[tier]}
                </h3>
                <div className="flex flex-1 flex-wrap items-center justify-center gap-x-5 gap-y-3">
                  {rows.map((sponsor) => (
                    <SponsorLogo
                      key={sponsor.id}
                      sponsor={sponsor}
                      locale={locale}
                      size={TIER_SIZE[tier]}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
