import { Link } from "@/components/Link";
import Image from "next/image";
import { heroMedia } from "@/data/media";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type Home = Dictionary["pages"]["home"];

export function HeroSection() {
  return (
    <section className="site-hero-media relative w-full overflow-hidden bg-[#050f21]">
      <div className="relative w-full aspect-[16/9]">
        <Image
          src={heroMedia.heroBanner}
          alt="BdAIO 2026 Dhaka Regional Round Banner"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>
    </section>
  );
}

export function IntroSection({ t }: { t: Home }) {
  return (
    <section className="bg-white py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-6 text-3xl font-black tracking-tight text-[#1e5a8a] sm:text-4xl">
          {t.introTitle}
        </h2>
        <div className="mx-auto mb-8 h-1 w-20 rounded bg-blue-500" />
        <p className="mb-10 text-base sm:text-lg leading-relaxed text-slate-600">
          {t.introBody}
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1e5a8a] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#0d3d6b]"
          >
            {t.introCta}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function MissionSection({ t }: { t: Home }) {
  return (
    <section className="bg-slate-50 py-20 border-y border-slate-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Mission Card */}
          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition hover:shadow-sm">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-[#1e5a8a]">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 0A3.75 3.75 0 0012 18z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V4.5m0 15v2.25m-9-9h2.25m15 0H21m-2.73-6.27l-1.59 1.59M6.32 17.68l-1.59 1.59m0-12.72l1.59 1.59m10.61 10.61l1.59-1.59" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-bold text-[#1e5a8a]">{t.missionTitle}</h3>
            <p className="text-sm leading-relaxed text-slate-500">{t.missionBody}</p>
          </div>

          {/* Gateway Card */}
          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition hover:shadow-sm">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-bold text-[#1e5a8a]">{t.gatewayTitle}</h3>
            <p className="text-sm leading-relaxed text-slate-500">{t.gatewayBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
