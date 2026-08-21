"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type HeroSlide = { src: string; alt: string };

export type HeroCarouselLabels = {
  region: string;
  pause: string;
  play: string;
  goTo: string;
};

/** How long each banner stays up. */
const INTERVAL_MS = 5_000;

/**
 * The hero banner rotation.
 *
 * Three things about this are load-bearing rather than stylistic:
 *
 *  1. **It can be stopped.** Content that moves on its own for more than five
 *     seconds needs a way to pause it (WCAG 2.2.2), and the home page is scored
 *     against a 0.98 accessibility floor in CI. The pause button is what makes
 *     the rotation permissible, not a nicety — so is honouring
 *     `prefers-reduced-motion`, which stops it before it ever starts.
 *
 *  2. **Every slide is laid out on top of the others, inside a fixed aspect
 *     ratio.** Nothing reflows when the banner changes, which keeps cumulative
 *     layout shift at zero — it is budgeted at 0.05 and currently measures 0,
 *     and a hero that resizes itself is the easiest way to lose that.
 *
 *  3. **Only the first slide is `priority`.** It is the LCP element of the
 *     busiest page on the site; marking the rest priority too would put them in
 *     the same race and make the one that matters arrive later.
 *
 * A single slide is a normal case, not a degenerate one: no timer, no controls,
 * just the image. That way the list in `src/data/media.ts` can shrink to one
 * without leaving a carousel rotating against itself.
 */
export function HeroCarousel({
  slides,
  labels,
}: {
  slides: readonly HeroSlide[];
  labels: HeroCarouselLabels;
}) {
  const multiple = slides.length > 1;
  const [index, setIndex] = useState(0);
  // Starts true so the server and the first client render agree; the effects
  // below turn it off for a visitor who has asked for less motion.
  const [playing, setPlaying] = useState(true);
  // Hover and keyboard focus suspend the rotation without touching `playing`,
  // so the button keeps showing what the visitor chose rather than flickering.
  const [suspended, setSuspended] = useState(false);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  // `prefers-reduced-motion` is read here rather than in a media query, because
  // the decision is "do not run a timer at all", which CSS cannot express.
  useEffect(() => {
    if (!multiple) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPlaying(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [multiple]);

  // A background tab should not be advancing banners nobody is looking at.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const apply = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, []);

  const running = multiple && playing && !suspended && !hidden;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [running, slides.length]);

  const regionRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: React.KeyboardEvent) {
    if (!multiple) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
  }

  return (
    <div
      ref={regionRef}
      // 40/21 is the banners' own ratio, not a design choice: the artwork is
      // 5000×2625 and 1600×839, both 1.905, and the box used to be 16/9 (1.778).
      // `object-cover` made up the difference by cropping 3.4% off each side,
      // which the gold banner survived and "BRONZE MEDALIST" very nearly did
      // not. Matching the artwork shows all of it. The box stays fixed, so
      // cumulative layout shift is still zero.
      //
      // Keep new banners at this ratio. A 16/9 one would be cropped top and
      // bottom instead, and nothing here will warn you.
      //
      // `group` is not needed — the controls are always visible. Hiding carousel
      // controls until hover leaves them unreachable on a touch screen, which is
      // most of this audience.
      className="relative w-full aspect-[40/21]"
      role={multiple ? "group" : undefined}
      aria-roledescription={multiple ? "carousel" : undefined}
      aria-label={multiple ? labels.region : undefined}
      onMouseEnter={() => setSuspended(true)}
      onMouseLeave={() => setSuspended(false)}
      onFocus={() => setSuspended(true)}
      onBlur={() => setSuspended(false)}
      onKeyDown={onKeyDown}
    >
      {slides.map((slide, i) => {
        const current = i === index;
        return (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
              current ? "opacity-100" : "opacity-0"
            }`}
            // The off-screen slides are not just invisible, they are out of the
            // accessibility tree and out of the tab order — otherwise a screen
            // reader reads all of them as though they were on the page at once.
            aria-hidden={!current}
            inert={!current || undefined}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              // Explicit sizes, or next/image assumes 100vw and serves the
              // widest candidate to a phone.
              sizes="100vw"
              className="object-cover"
              priority={i === 0}
              quality={70}
            />
          </div>
        );
      })}

      {multiple && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 p-3 sm:p-4">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? labels.pause : labels.play}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {/* Inline SVG: two glyphs are not worth a request or a font. */}
            {playing ? (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
                <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M4 2l10 6-10 6z" fill="currentColor" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => go(i)}
                aria-label={`${labels.goTo} ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  i === index ? "w-6 bg-white" : "w-2.5 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
