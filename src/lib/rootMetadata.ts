import type { Metadata, Viewport } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_TITLE, siteUrl } from "@/lib/seo";

/**
 * Metadata shared by both root layouts.
 *
 * There are two roots — `[locale]` for public pages and `(app)` for the
 * authenticated tree — because they resolve the locale differently (§13.2). This
 * keeps the site-level metadata in one place so the two cannot drift apart, which
 * would silently give the dashboard a different manifest or icon set.
 */
export const DESCRIPTION =
  "BdAIO is the national AI Olympiad for Bangladeshi students — a pathway to international competitions like IOAI and IAIO.";

export const rootMetadata: Metadata = {
  // Without metadataBase, every relative Open Graph image resolves against
  // localhost in production and social previews silently break.
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["BdAIO", "AI Olympiad", "Bangladesh", "Artificial Intelligence", "IOAI", "IAIO"],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: DESCRIPTION,
    url: siteUrl(),
    locale: "en_US",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const rootViewport: Viewport = {
  // Tints the browser chrome on Android and the status bar in standalone mode.
  themeColor: "#026f89",
};
