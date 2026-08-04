/**
 * Locale configuration — Phase 7b.
 *
 * **Dependency-free on purpose.** `src/proxy.ts` does the locale redirect, and
 * the proxy bundle cannot be async: importing anything that reaches
 * `server-only`, Prisma, or `jose` breaks every route with a 500 (§3.5). This
 * module is the i18n equivalent of `src/lib/auth/constants.ts` — plain values and
 * pure functions, safe to import from the proxy, a client component, or a server
 * component alike.
 */

export const LOCALES = ["en", "bn"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * English is the default because the olympiad's own materials, the syllabus, and
 * the international pathway (IOAI/APAIO) are in English. Bengali is a first-class
 * translation, not a fallback — see §9 of the plan: no feature ships
 * English-only.
 */
export const DEFAULT_LOCALE: Locale = "en";

/** Remembers a visitor's choice so the toggle survives a navigation. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** A year: this is a preference, not a session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** What each locale is called *in that locale* — never "Bengali" in English. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  bn: "বাংলা",
};

/**
 * Two-letter codes for the compact toggle in the header.
 *
 * Latin for both, including Bengali: "BN" in a 10px chip stays legible where
 * "বাং" would be a smudge, and the full name is still what a screen reader
 * announces — see the `aria-label` in `LanguageToggle`.
 */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  bn: "BN",
};

/** The `lang` attribute / `hreflang` value for each locale. */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  en: "en",
  bn: "bn",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Splits `/bn/events/foo` into its locale and the path without it.
 *
 * Returns `locale: null` when the path carries no locale prefix, which is what
 * the proxy uses to decide whether a redirect is needed.
 */
export function splitLocale(pathname: string): {
  locale: Locale | null;
  rest: string;
} {
  const segments = pathname.split("/");
  // segments[0] is "" for a leading slash.
  const first = segments[1];
  if (isLocale(first)) {
    const rest = `/${segments.slice(2).join("/")}`;
    return { locale: first, rest: rest === "/" ? "/" : rest.replace(/\/$/, "") };
  }
  return { locale: null, rest: pathname };
}

/** Builds a locale-prefixed path: ("bn", "/events") → "/bn/events". */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  // Strip an existing prefix so this is safe to apply to an already-localized
  // path — otherwise a language toggle produces /bn/en/events.
  const { rest } = splitLocale(clean);
  return rest === "/" ? `/${locale}` : `/${locale}${rest}`;
}

/**
 * Picks a locale from the request, most explicit signal first:
 *   1. the cookie — the visitor used the toggle, so honour it above all else;
 *   2. `Accept-Language` — their browser's stated preference;
 *   3. the default.
 *
 * Hand-rolled rather than pulling in `negotiator` + `@formatjs/intl-localematcher`
 * as the Next guide suggests: two locales do not justify two dependencies in the
 * proxy, which runs on every request including prefetches.
 */
export function pickLocale(input: {
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(input.cookie)) return input.cookie;

  for (const tag of parseAcceptLanguage(input.acceptLanguage)) {
    // Match the base language, so `bn-BD` and `bn-IN` both resolve to `bn`.
    const base = tag.split("-")[0]?.toLowerCase();
    if (isLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}

/** `Accept-Language` tags, best-quality first. Ignores malformed q-values. */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];

  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const quality = q === undefined ? 1 : Number.parseFloat(q);
      return {
        tag: (tag ?? "").trim(),
        // A malformed q= sorts last rather than poisoning the comparison with NaN.
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => entry.tag);
}
