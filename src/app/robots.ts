import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Signed-in surfaces. Nothing here is reachable without a session, so
        // this is politeness and crawl budget rather than access control.
        "/dashboard",
        "/admin",
        // Route handlers, none of which return indexable pages.
        "/api/",
        // User-uploaded files, served straight from disk.
        "/uploads/",
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
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
