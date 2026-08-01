import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { LOCALES } from "@/lib/i18n/config";

/**
 * Public pages now live behind a locale prefix (Phase 7b), so a rule written as
 * `/verify/` would no longer match anything. Paths that exist in both languages
 * are expanded per locale; the authenticated tree and the route handlers are not
 * localized, so they stay as they are.
 */
const LOCALIZED_DISALLOW = [
  // Certificate verification is public by design, but each URL contains a
  // holder's name — having those turn up in search results is not what a
  // verification link is for.
  "/verify/",
  // Auth flows carry single-use tokens in the query string.
  "/reset-password",
  "/verify-email",
  // Filtered views of the directory: crawling every division × district
  // combination adds nothing the unfiltered page doesn't already list.
  "/institutions?",
];

export default function robots(): MetadataRoute.Robots {
  const localized = LOCALES.flatMap((locale) =>
    LOCALIZED_DISALLOW.map((path) => `/${locale}${path}`),
  );

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Signed-in surfaces, which are not locale-prefixed. Nothing here is
        // reachable without a session, so this is politeness and crawl budget
        // rather than access control.
        "/dashboard",
        "/admin",
        // Route handlers, none of which return indexable pages.
        "/api/",
        // User-uploaded files, served straight from disk.
        "/uploads/",
        ...localized,
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
