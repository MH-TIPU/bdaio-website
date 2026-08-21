"use client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

import { useEffect } from "react";
import confetti from "canvas-confetti";

type Home = Dictionary["pages"]["home"];

export function CelebrationSection({ t, enabled = true }: { t: Home; enabled?: boolean }) {
  const fireConfetti = () => {
    if (!enabled) return;

    // 1. Initial Left side burst
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#FFD700", "#F59E0B", "#10B981", "#3B82F6", "#EC4899"],
    });

    // 2. Initial Right side burst
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#FFD700", "#F59E0B", "#10B981", "#3B82F6", "#EC4899"],
    });

    // 3. Staggered golden center shower
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 90,
        spread: 80,
        origin: { x: 0.5, y: 0.7 },
        colors: ["#FFD700", "#FBBF24", "#F59E0B"],
      });
    }, 250);
  };

  useEffect(() => {
    if (!enabled) return;
    // Small delay to let the page settle before blasting confetti
    const timer = setTimeout(() => {
      fireConfetti();
    }, 800);
    return () => clearTimeout(timer);
  }, [enabled]);

  return (
    <section className="bg-white py-16 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Top Decorative Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <span>🏆</span> {t.achievementBadge}
        </div>

        {/* Title Section */}
        <h2 className="text-3xl font-black tracking-tight text-bdaio-blue sm:text-4xl mb-4">
          {t.achievementTitle}
        </h2>
        
        <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
          {t.achievementLead}{" "}
          <span className="font-semibold text-slate-900">
            {t.achievementEvent}
          </span>
          {t.achievementWinning}{" "}
          {/* amber-800 rather than amber-600: on the amber-50 chip, 600 lands at
              about 3.3:1 and WCAG AA wants 4.5:1 for text this size. */}
          <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
            {t.achievementMedals}
          </span>
          !
        </p>

        {/* Medalists Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto mb-10">
          {[
            { name: "Labib Shahriar" },
            { name: "Shaidozzaman Araf" },
            { name: "Tridib Roy Arjo" },
          ].map((medalist, i) => (
            <div
              key={i}
              className="group flex flex-col items-center p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition duration-300 hover:shadow-md hover:-translate-y-1"
            >
              {/* Gold Badge Container */}
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 text-4xl shadow-xs text-amber-600 transition-transform duration-300 group-hover:scale-110">
                <span>🏅</span>
              </div>
              <h3 className="text-lg font-bold text-bdaio-blue">{medalist.name}</h3>
              {/* amber-700, not 600: at this size AA wants 4.5:1 and 600 lands at 3.3. */}
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mt-1">
                {t.goldMedalist}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
