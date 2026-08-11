import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TITLE } from "@/lib/seo";

/**
 * Web app manifest — what makes the site installable on a phone home screen.
 *
 * `start_url` is `/dashboard`: someone who installs BdAIO is almost always a
 * participant checking their registrations or results, and an installed app that
 * opens the marketing home page feels like a bookmark. Signed-out visitors are
 * redirected to /login by the proxy, which is the right landing place for them.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: SITE_NAME,
    description:
      "Register for BdAIO olympiads and workshops, follow your results, and collect your certificates.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0e3268",
    lang: "en",
    dir: "ltr",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops this one to the launcher's shape; the glyph is padded into
      // the 80% safe zone so a circular mask cannot clip it.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Events", url: "/events" },
      { name: "My registrations", url: "/dashboard/registrations" },
      { name: "Results", url: "/results" },
    ],
  };
}
