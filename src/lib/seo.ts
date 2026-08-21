import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_HREFLANG,
  isLocale,
  localePath,
  type Locale,
} from "@/lib/i18n/config";

/**
 * One source of truth for canonical URLs, social cards, and structured data.
 *
 * Pages should build their metadata through `pageMetadata()` rather than
 * hand-rolling an object, so a canonical URL and an Open Graph card are never
 * forgotten — a bare `{ title }` silently ships a page with no share preview.
 */

export const SITE_NAME = "BdAIO";
export const SITE_TITLE = "Bangladesh Artificial Intelligence Olympiad (BdAIO)";
export const DEFAULT_OG_IMAGE = "/og.png";

/**
 * The public origin, from `APP_URL` (the same variable email links use — two
 * sources of truth here would eventually disagree).
 *
 * Read at build time, which is what we want: `next build` runs on the server
 * during deploy with `.env` present, and the value must be identical in the
 * sitemap, the canonical tags, and the manifest. Change `APP_URL` → rebuild.
 */
export function siteUrl(): string {
  const raw = process.env.APP_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetadataInput = {
  title: string;
  description?: string | null;
  /**
   * Site-relative path **without** a locale prefix, e.g. `/events/bdaio-2026`.
   * The prefix is added here so no caller can produce a canonical URL that
   * disagrees with the page's own address.
   */
  path: string;
  /**
   * The locale this page is being rendered in. Accepts the raw route param, so
   * callers can pass `params.locale` straight through without narrowing it —
   * anything unrecognised falls back to the default rather than throwing inside
   * metadata generation, where an exception costs the whole page.
   */
  locale?: Locale | string;
  /** Site-relative or absolute image; defaults to the site card. */
  image?: string | null;
  type?: "website" | "article" | "profile";
  /** Set false for pages that are public but should not be in search results. */
  index?: boolean;
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
};

/** The `og:locale` value each locale maps to. */
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
};

export function pageMetadata({
  title,
  description,
  path,
  locale: requestedLocale = DEFAULT_LOCALE,
  image,
  type = "website",
  index = true,
  publishedTime,
  modifiedTime,
}: PageMetadataInput): Metadata {
  const locale: Locale = isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  const url = absoluteUrl(localePath(locale, path));
  const desc = description?.trim() || undefined;
  const card = image ? absoluteUrl(image) : absoluteUrl(DEFAULT_OG_IMAGE);

  // Every language of a page points at every other, itself included — which is
  // what Google expects, and what stops the two translations being read as
  // duplicate content competing with each other.
  const languages = Object.fromEntries(
    LOCALES.map((l) => [LOCALE_HREFLANG[l], absoluteUrl(localePath(l, path))]),
  );

  return {
    title,
    description: desc,
    alternates: {
      canonical: url,
      languages: {
        ...languages,
        // Tells a crawler which version to serve when it has no better signal.
        "x-default": absoluteUrl(localePath(DEFAULT_LOCALE, path)),
      },
    },
    robots: index ? undefined : { index: false, follow: false },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE_NAME,
      type,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [{ url: card }],
      ...(publishedTime ? { publishedTime: publishedTime.toISOString() } : {}),
      ...(modifiedTime ? { modifiedTime: modifiedTime.toISOString() } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [card],
    },
  };
}

/** Truncates prose to a length search engines will actually display. */
export function metaDescription(
  text: string | null | undefined,
  max = 155,
): string | undefined {
  if (!text) return undefined;
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat || undefined;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

// --- Structured data -------------------------------------------------------
//
// Rendered through <JsonLd> (src/components/JsonLd.tsx), which escapes `<`
// before the payload reaches the DOM.

type JsonLdObject = Record<string, unknown>;

/**
 * The organisation entity, emitted on every public page.
 *
 * The contact address and `sameAs` profiles come from site settings rather than
 * this file: they are the parts an organiser changes, and a search engine
 * reading a decommissioned address is a support burden nobody sees coming.
 * Both are omitted when unset — an empty `sameAs` is a claim we do not want to
 * make.
 */
export function organizationJsonLd(
  contact: { email?: string; sameAs?: string[] } = {},
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_TITLE,
    alternateName: SITE_NAME,
    url: siteUrl(),
    logo: absoluteUrl("/icon-512.png"),
    description:
      "The national Artificial Intelligence Olympiad for Bangladeshi students, and their pathway to international olympiads such as IOAI and APAIO.",
    address: { "@type": "PostalAddress", addressCountry: "BD" },
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.sameAs?.length ? { sameAs: contact.sameAs } : {}),
  };
}

export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_TITLE,
    url: siteUrl(),
    inLanguage: ["en", "bn"],
  };
}

type EventForJsonLd = {
  title: string;
  slug: string;
  description: string | null;
  mode: "ONLINE" | "OFFLINE" | "HYBRID";
  venue: string | null;
  onlineUrl: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  feeBdt: number | null;
  banner: string | null;
  regOpensAt: Date | null;
};

/**
 * schema.org/Event. Omitted entirely by the caller when the event has no start
 * date — a dateless Event is invalid structured data, and a warning in Search
 * Console is worse than no markup.
 */
export function eventJsonLd(event: EventForJsonLd): JsonLdObject {
  const attendance = {
    ONLINE: "https://schema.org/OnlineEventAttendanceMode",
    OFFLINE: "https://schema.org/OfflineEventAttendanceMode",
    HYBRID: "https://schema.org/MixedEventAttendanceMode",
  }[event.mode];

  const location: JsonLdObject[] = [];
  if (event.mode !== "ONLINE" && event.venue) {
    location.push({
      "@type": "Place",
      name: event.venue,
      address: { "@type": "PostalAddress", addressCountry: "BD" },
    });
  }
  if (event.mode !== "OFFLINE") {
    location.push({
      "@type": "VirtualLocation",
      url: event.onlineUrl ?? absoluteUrl(`/events/${event.slug}`),
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: metaDescription(event.description, 300),
    url: absoluteUrl(`/events/${event.slug}`),
    startDate: event.startsAt?.toISOString(),
    endDate: event.endsAt?.toISOString(),
    eventAttendanceMode: attendance,
    eventStatus: "https://schema.org/EventScheduled",
    ...(location.length ? { location: location.length === 1 ? location[0] : location } : {}),
    ...(event.banner ? { image: absoluteUrl(event.banner) } : { image: absoluteUrl(DEFAULT_OG_IMAGE) }),
    organizer: {
      "@type": "EducationalOrganization",
      name: SITE_TITLE,
      url: siteUrl(),
    },
    offers: {
      "@type": "Offer",
      price: event.feeBdt ?? 0,
      priceCurrency: "BDT",
      url: absoluteUrl(`/events/${event.slug}`),
      availability: "https://schema.org/InStock",
      ...(event.regOpensAt ? { validFrom: event.regOpensAt.toISOString() } : {}),
    },
  };
}

/**
 * schema.org/Person for a public profile.
 *
 * Callers must not pass a minor's profile: §3.7 keeps minors out of search
 * results entirely, and structured data is exactly the machine-readable dossier
 * that policy exists to prevent.
 */
export function personJsonLd(person: {
  displayName: string;
  handle: string;
  bio: string | null;
  photo: string | null;
  institutionName: string | null;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.displayName,
    url: absoluteUrl(`/u/${person.handle}`),
    description: metaDescription(person.bio, 300),
    ...(person.photo ? { image: absoluteUrl(person.photo) } : {}),
    ...(person.institutionName
      ? { affiliation: { "@type": "EducationalOrganization", name: person.institutionName } }
      : {}),
  };
}

export function institutionJsonLd(institution: {
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  district: string | null;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: institution.name,
    url: absoluteUrl(`/institutions/${institution.slug}`),
    description: metaDescription(institution.description, 300),
    ...(institution.logo ? { logo: absoluteUrl(institution.logo) } : {}),
    ...(institution.website ? { sameAs: institution.website } : {}),
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
      ...(institution.district ? { addressRegion: institution.district } : {}),
    },
  };
}

export function breadcrumbJsonLd(
  trail: { name: string; path: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
