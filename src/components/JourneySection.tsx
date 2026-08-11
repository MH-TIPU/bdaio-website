import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type Home = Dictionary["pages"]["home"];

/** Numbers and destinations stay in code; the words come from the dictionary. */
const STEP_LINKS = [
  { number: "01", href: "/participation-guideline" },
  { number: "02", href: "/rules" },
  { number: "03", href: "/syllabus" },
  { number: "04", href: "/events" },
  { number: "05", href: "/archives" },
];

export function JourneySection({ t }: { t: Home }) {
  const steps = STEP_LINKS.map((link, i) => ({ ...link, ...t.journeySteps[i] }));

  return (
    <section className="bg-white py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-bdaio-blue">{t.journeyTitle}</h2>
          <p className="mt-2 text-slate-500">
            {t.journeyLead}
          </p>
        </div>

        {/* Journey Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 relative">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative flex flex-col rounded-2xl border border-slate-100 bg-slate-50/40 p-6 shadow-xs transition-all duration-300 hover:shadow-md hover:bg-slate-50/80 group"
            >
              {/* Hidden from assistive tech — the step's position is already
                  carried by the order of the list, and reading "01" before
                  "Register" adds nothing.

                  Legible rather than a 20%-opacity watermark, though: a step
                  number nobody can read is decoration pretending to be
                  information. At 30px bold the AA threshold is 3:1, which this
                  clears; the old value was under 1.5:1. */}
              <span
                aria-hidden="true"
                className="text-3xl font-black text-bdaio-blue/80 group-hover:text-bdaio-blue transition-colors block mb-4"
              >
                {step.number}
              </span>
              <h3 className="text-lg font-bold text-bdaio-blue mb-2">{step.title}</h3>
              <p className="text-xs leading-relaxed text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>

        {/* WhatsApp Card */}
        <div className="mt-16 text-center">
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-100 bg-[#f0fdf4] p-8 shadow-xs">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.journeyCommunity}</h3>
            <p className="text-sm text-slate-500 mb-6">
              {t.journeyCommunityBody}
            </p>
            <a
              href="https://chat.whatsapp.com/CgDwX7Zi5BoE8kFuefb8k6?mode=gi_t"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800 hover:shadow-emerald-700/35"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.66.986 3.288 1.488 4.957 1.489 5.433 0 9.85-4.414 9.854-9.843.002-2.63-1.023-5.101-2.887-6.968C16.666 1.965 14.191.94 11.56.94c-5.438 0-9.854 4.416-9.858 9.845-.002 1.81.474 3.582 1.382 5.148L2.06 21.97l6.082-1.596z" />
              </svg>
              {t.journeyCommunityCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
