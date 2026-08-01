import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
import { DEFAULT_LOCALE, LOCALES, LOCALE_HREFLANG, localePath } from "@/lib/i18n/config";

/**
 * One sitemap entry per page, listing the default-locale URL with an
 * `alternates.languages` map to every translation.
 *
 * Deliberately *not* one entry per locale: that would list the same page twice
 * and lose the relationship between the two, which is the thing that stops
 * translations being read as duplicates competing with each other.
 */
function localizedEntry(
  path: string,
  extras: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(localePath(DEFAULT_LOCALE, path)),
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [LOCALE_HREFLANG[l], absoluteUrl(localePath(l, path))]),
      ),
    },
    ...extras,
  };
}

/**
 * The sitemap is generated from the database, which means it inherits the same
 * visibility rules as the pages themselves. Every query here mirrors a rule
 * documented in docs/PLATFORM_PLAN.md §3.7:
 *
 *  - DRAFT events, PENDING institutions and unpublished CMS pages are invisible
 *    on the site, so listing them would advertise URLs that 404.
 *  - Public profiles are opt-in, and **minors are excluded entirely** — their
 *    pages are `noindex`, and a sitemap entry is a direct invitation to crawl.
 *
 * Regenerated hourly rather than at build time: events and approvals happen
 * without a deploy.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Hand-maintained pages. Anything file-based lives here; database-driven URLs
  // are appended below.
  const staticEntries: MetadataRoute.Sitemap = (
    [
      { path: "/", changeFrequency: "weekly", priority: 1 },
      { path: "/about", changeFrequency: "monthly", priority: 0.7 },
      { path: "/programs", changeFrequency: "weekly", priority: 0.9 },
      { path: "/events", changeFrequency: "daily", priority: 0.9 },
      { path: "/workshops", changeFrequency: "weekly", priority: 0.8 },
      { path: "/institutions", changeFrequency: "weekly", priority: 0.7 },
      { path: "/results", changeFrequency: "weekly", priority: 0.8 },
      { path: "/resources", changeFrequency: "weekly", priority: 0.7 },
      { path: "/announcements", changeFrequency: "daily", priority: 0.6 },
      { path: "/news", changeFrequency: "weekly", priority: 0.6 },
      { path: "/archives", changeFrequency: "monthly", priority: 0.5 },
      { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
      { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
      { path: "/syllabus", changeFrequency: "yearly", priority: 0.6 },
      { path: "/participation-guideline", changeFrequency: "yearly", priority: 0.6 },
      { path: "/rules", changeFrequency: "yearly", priority: 0.6 },
      { path: "/institutions/register", changeFrequency: "yearly", priority: 0.5 },
      { path: "/register", changeFrequency: "yearly", priority: 0.5 },
    ] as const
  ).map(({ path, ...extras }) => localizedEntry(path, { lastModified: now, ...extras }));

  // Anyone over 18 who opted into a public profile. `dateOfBirth: null` means we
  // don't know their age, so they are treated as an adult here — consistent with
  // isMinorOn(), which the profile page itself uses.
  const eighteenYearsAgo = new Date(now);
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  const [programs, events, institutions, pages, resultEvents, profiles] =
    await Promise.all([
      db.program.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.event.findMany({
        where: { status: { not: "DRAFT" } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.institution.findMany({
        where: { status: "APPROVED" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.page.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      // A leaderboard exists only once an admin has published a round's results
      // — the same condition /results itself filters on.
      db.event.findMany({
        where: { rounds: { some: { results: { some: { published: true } } } } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.profile.findMany({
        where: {
          handle: { not: null },
          visibility: "PUBLIC",
          user: { status: { not: "SUSPENDED" } },
          OR: [
            { dateOfBirth: null },
            { dateOfBirth: { lte: eighteenYearsAgo } },
          ],
        },
        select: { handle: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  return [
    ...staticEntries,
    ...programs.map((p) =>
      localizedEntry(`/programs/${p.slug}`, {
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.8,
      }),
    ),
    ...events.map((e) =>
      localizedEntry(`/events/${e.slug}`, {
        lastModified: e.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    ),
    ...resultEvents.map((e) =>
      localizedEntry(`/results/${e.slug}`, {
        lastModified: e.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      }),
    ),
    ...institutions.map((i) =>
      localizedEntry(`/institutions/${i.slug}`, {
        lastModified: i.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    ),
    ...pages.map((p) =>
      localizedEntry(`/p/${p.slug}`, {
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      }),
    ),
    ...profiles.map((p) =>
      localizedEntry(`/u/${p.handle}`, {
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.4,
      }),
    ),
  ];
}
