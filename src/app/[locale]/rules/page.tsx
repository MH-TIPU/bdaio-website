import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/components/Link";
import { pageMetadata } from "@/lib/seo";
import { dictionaryFor, getDictionary, isLocale, localePath } from "@/lib/i18n";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/rules">,
): Promise<Metadata> {
  const { locale } = await params;
  const meta = dictionaryFor(locale).pages.rules;
  return pageMetadata({
    locale,
    path: "/rules",
    title: meta.title,
    description: meta.lead,
  });
}

/**
 * The four rule cards were four hand-written blocks of near-identical markup.
 * They are driven by the dictionary now, which is what makes them translatable —
 * and it means the icon and accent colour live here, keyed by position, instead
 * of being repeated inside each card.
 */
const CARD_STYLES = [
  { accent: "bg-blue-500/10 text-blue-600", bullet: "text-blue-500" },
  { accent: "bg-emerald-500/10 text-emerald-600", bullet: "text-emerald-500" },
  { accent: "bg-amber-500/10 text-amber-600", bullet: "text-amber-500" },
  { accent: "bg-violet-500/10 text-violet-600", bullet: "text-violet-500" },
];

const CARD_ICONS = [
  // Eligibility — people
  "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 20M18 9a3 3 0 11-6 0 3 3 0 016 0zM6 9a3 3 0 11-6 0 3 3 0 016 0zm3 10.5a9 9 0 1118 0",
  // Phases — check in a circle
  "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  // AI segment — code brackets
  "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
  // Quiz — question mark in a circle
  "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z",
];

export default async function RulesPage({ params }: PageProps<"/[locale]/rules">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).pages.rules;

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-3 text-lg text-slate-500">{t.lead}</p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-bdaio-blue-light" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-16">
          {t.cards.map((card, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl mb-6 ${style.accent}`}
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={CARD_ICONS[i % CARD_ICONS.length]}
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    {card.title}
                  </h2>
                  <ul className="space-y-3 text-sm text-slate-500">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className={style.bullet}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guideline Redirect */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-8 text-center max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-bdaio-blue mb-2">{t.ctaTitle}</h3>
          <p className="text-sm text-slate-500 mb-5">{t.ctaBody}</p>
          <Link
            href={localePath(locale, "/participation-guideline")}
            className="inline-flex items-center gap-2 rounded-xl bg-bdaio-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-bdaio-blue-dark"
          >
            {t.ctaButton}
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
