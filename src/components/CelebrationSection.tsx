"use client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

import { useCallback, useEffect } from "react";
import confetti from "canvas-confetti";

type Home = Dictionary["pages"]["home"];
type Achievement = Home["achievements"][number];

/**
 * Palettes per result.
 *
 * The contrast notes are the point of this table. Every value here sits on
 * white or on its own 50-weight tint, and WCAG AA wants 4.5:1 for text this
 * size — the amber-600 that reads as "gold" lands at about 3.3:1, which is why
 * nothing here uses it for text. The home page is scored against a 0.98
 * accessibility floor in CI and axe checks this section on every run, so
 * reaching for a lighter shade to make it look nicer will fail the build.
 */
const TONES = {
  gold: {
    badge: "bg-amber-50 border-amber-200 text-amber-800",
    highlight: "text-amber-800 bg-amber-50",
    disc: "from-amber-50 to-yellow-100 border-amber-200",
    label: "text-amber-700",
    emoji: "🏅",
  },
  bronze: {
    // orange-900/800 rather than a literal bronze: it reads as the warmer,
    // darker metal beside the gold block and clears AA comfortably, where a
    // mid-weight orange would not.
    badge: "bg-orange-50 border-orange-200 text-orange-900",
    highlight: "text-orange-900 bg-orange-50",
    disc: "from-orange-50 to-amber-100 border-orange-200",
    label: "text-orange-800",
    emoji: "🥉",
  },
} as const;

export function CelebrationSection({ t, enabled = true }: { t: Home; enabled?: boolean }) {
  /**
   * `useCallback` so the effect below can depend on it honestly. It used to be a
   * plain function that the effect called while omitting it from its dependency
   * array — which worked, but only because nothing in it changed.
   */
  const fireConfetti = useCallback(() => {
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
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    // Small delay to let the page settle before blasting confetti
    const timer = setTimeout(() => {
      fireConfetti();
    }, 800);
    return () => clearTimeout(timer);
  }, [enabled, fireConfetti]);

  // One burst for the page, not one per result — two results should not mean
  // twice the confetti.
  return (
    <>
      {t.achievements.map((achievement) => (
        <AchievementBlock key={achievement.title} achievement={achievement} />
      ))}
    </>
  );
}

function AchievementBlock({ achievement }: { achievement: Achievement }) {
  const tone = TONES[achievement.tone];

  return (
    <section className="bg-white py-16 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Decorative Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider mb-6 ${tone.badge}`}
        >
          {/* The trophy is decoration beside text that already says this. */}
          <span aria-hidden="true">🏆</span> {achievement.badge}
        </div>

        {/* Title Section */}
        <h2 className="text-3xl font-black tracking-tight text-bdaio-blue sm:text-4xl mb-4">
          {achievement.title}
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
          {achievement.lead}{" "}
          <span className="font-semibold text-slate-900">{achievement.event}</span>
          {achievement.winning}{" "}
          <span className={`font-bold px-2 py-0.5 rounded ${tone.highlight}`}>
            {achievement.medals}
          </span>
          !
        </p>

        {/* Medalists Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto mb-10">
          {achievement.medalists.map((name) => (
            <div
              key={name}
              className="group flex flex-col items-center p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition duration-300 hover:shadow-md hover:-translate-y-1"
            >
              {/* Medal Badge Container */}
              <div
                className={`relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br border text-4xl shadow-xs transition-transform duration-300 group-hover:scale-110 ${tone.disc}`}
              >
                {/* Decorative: the label underneath already names the medal. */}
                <span aria-hidden="true">{tone.emoji}</span>
              </div>
              {/*
                Two lines' worth of room whether the name needs it or not, so
                the medal labels below line up across the row. "Mobtasim
                Chowdhury Priom" wraps where the others do not, and without this
                its label sits a line lower than its neighbours'.
              */}
              <h3 className="flex min-h-14 items-center text-lg font-bold text-bdaio-blue">
                {name}
              </h3>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mt-1 ${tone.label}`}
              >
                {achievement.medalLabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
