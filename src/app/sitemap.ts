import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

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
  const staticEntries: MetadataRoute.Sitemap = ([
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/programs"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/events"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/workshops"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/institutions"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/results"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/resources"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/announcements"), changeFrequency: "daily", priority: 0.6 },
    { url: absoluteUrl("/news"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/archives"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/syllabus"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/participation-guideline"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/rules"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/institutions/register"), changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/register"), changeFrequency: "yearly", priority: 0.5 },
  ] as const).map((entry) => ({ lastModified: now, ...entry }));

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
    ...programs.map((p) => ({
      url: absoluteUrl(`/programs/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...events.map((e) => ({
      url: absoluteUrl(`/events/${e.slug}`),
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...resultEvents.map((e) => ({
      url: absoluteUrl(`/results/${e.slug}`),
      lastModified: e.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...institutions.map((i) => ({
      url: absoluteUrl(`/institutions/${i.slug}`),
      lastModified: i.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...pages.map((p) => ({
      url: absoluteUrl(`/p/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...profiles.map((p) => ({
      url: absoluteUrl(`/u/${p.handle}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
