import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { en, type Dictionary } from "@/lib/i18n/dictionaries/en";

export type { Locale, Dictionary };
export * from "@/lib/i18n/config";

const DICTIONARIES: Record<Locale, Dictionary> = { en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/**
 * Dictionary for a raw route param.
 *
 * `generateMetadata` runs before the page body, so it cannot rely on the
 * page's own `notFound()` guard — and throwing there costs the whole page
 * rather than just the metadata. An unrecognised locale falls back to the
 * default; the page still 404s a moment later.
 */
export function dictionaryFor(locale: string): Dictionary {
  return getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
}

/**
 * The locale for an authenticated page, read from the cookie.
 *
 * With `LOCALES` down to `en` this always returns the default, and nothing writes
 * the cookie any more — the language toggle went with the rest of the bilingual
 * UI in the routing flatten (§13.2). It is kept because it is the one place the
 * authenticated tree asks "which language?", and a second locale would answer it
 * here rather than at every call site.
 */
export async function getSessionLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Convenience for authenticated pages: the locale and its dictionary at once. */
export async function getSessionDictionary(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getSessionLocale();
  return { locale, t: getDictionary(locale) };
}
