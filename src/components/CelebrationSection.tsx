"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function CelebrationSection() {
  const fireConfetti = () => {
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
    // Small delay to let the page settle before blasting confetti
    const timer = setTimeout(() => {
      fireConfetti();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="bg-white py-16 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Top Decorative Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <span>🏆</span> Historic Achievement
        </div>

        {/* Title Section */}
        <h2 className="text-3xl font-black tracking-tight text-[#1e5a8a] sm:text-4xl mb-4">
          Bangladesh at APOAI 2026!
        </h2>
        
        <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
          Team Bangladesh has achieved an extraordinary milestone at the{" "}
          <span className="font-semibold text-slate-900">
            Asia-Pacific Olympiad in Artificial Intelligence (APOAI) 2026
          </span>
          , winning{" "}
          <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            3 Gold Medals
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
              <h3 className="text-lg font-bold text-[#1e5a8a]">{medalist.name}</h3>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mt-1">
                Gold Medalist
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
