import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/components/Link";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/community/publicProfile";
import { BadgeChip } from "@/components/community/BadgeChip";
import { JsonLd } from "@/components/JsonLd";
import { metaDescription, pageMetadata, personJsonLd } from "@/lib/seo";
import { dictionaryFor } from "@/lib/i18n";

const KIND_LABELS: Record<string, string> = {
  ORGANIZING: "Organising",
  MENTORING: "Mentoring",
  CONTENT: "Content",
  TRANSLATION: "Translation",
  JUDGING: "Judging",
  OTHER: "Other",
};

/**
 * Empty on purpose, and required: a dynamic segment with no
 * `generateStaticParams` at all is rendered fresh on every request — the build
 * marks it `f` and nothing is ever cached. Returning an array, even an empty
 * one, makes the route eligible for ISR, so the first visitor pays for the
 * render and everyone after them is served from cache until `revalidate`
 * expires.
 *
 * Empty rather than enumerated because these paths are open-ended and change
 * without a deploy. Listing them at build time would prerender whatever existed
 * that morning, and `generateStaticParams` is not re-run during revalidation —
 * so anything added later would be the only thing still rendering per request.
 */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(
  props: PageProps<"/u/[handle]">,
): Promise<Metadata> {
  const { handle } = await props.params;
  const profile = await getPublicProfile(handle);
  if (!profile) return { title: "Profile not found", robots: { index: false } };
  return pageMetadata({
    locale: "en",
    title: `${profile.displayName} · BdAIO`,
    description: metaDescription(profile.bio) ?? `${profile.displayName} on BdAIO.`,
    path: `/u/${handle}`,
    // A minor's photo must not travel in a share card either.
    image: profile.isMinor ? null : profile.photoUrl,
    type: "profile",
    // Minors' pages are deliberately kept out of search indexes.
    index: !profile.isMinor,
  });
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default async function PublicProfilePage(props: PageProps<"/u/[handle]">) {
  const locale = "en";
  const { handle } = await props.params;
  const common = dictionaryFor(locale).common;
  const profile = await getPublicProfile(handle);

  // A private or non-existent profile is indistinguishable from outside.
  if (!profile) notFound();

  return (
    <section className="bg-slate-50/50 py-16">
      {/* No Person markup for minors: §3.7 keeps them out of search results, and
          structured data is precisely the machine-readable dossier that rule
          exists to prevent. */}
      {!profile.isMinor && (
        <JsonLd
          data={personJsonLd({
            displayName: profile.displayName,
            handle: profile.handle,
            bio: profile.bio,
            photo: profile.photoUrl,
            institutionName: profile.institution?.name ?? null,
          })}
        />
      )}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
              {profile.photoUrl ? (
                <Image
                  src={profile.photoUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-500">
                  {initials(profile.displayName)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {profile.displayName}
              </h1>

              {profile.institution && (
                <p className="mt-1 text-sm text-slate-600">
                  <Link
                    href={`/institutions/${profile.institution.slug}`}
                    className="font-medium text-bdaio-blue hover:underline"
                  >
                    {profile.institution.name}
                  </Link>
                  {profile.verifiedStudent && (
                    <span className="ml-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/80 shadow-2xs">
                      <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </span>
                  )}
                </p>
              )}

              {profile.district && (
                <p className="text-sm text-slate-500">{profile.district}</p>
              )}

              {profile.badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.badges.map((badge) => (
                    <BadgeChip key={badge.id} type={badge.type} title={badge.title} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-5 border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-700">
              {profile.bio}
            </p>
          )}

          {profile.isMinor && (
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
              This participant is under 18, so only limited information is shown.
            </p>
          )}
        </div>

        {profile.roles.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">{common.communityRoles}</h2>
            <ul className="mt-3 space-y-2">
              {profile.roles.map((role) => (
                <li key={`${role.type}-${role.institution ?? "global"}`} className="text-sm text-slate-700">
                  <span className="font-medium">
                    {role.type.charAt(0) + role.type.slice(1).toLowerCase()}
                  </span>
                  {role.institution ? ` · ${role.institution}` : " · BdAIO"}
                  {role.since && (
                    <span className="text-slate-500">
                      {" "}
                      since {role.since.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.contributions.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">{common.contributions}</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {profile.contributions.map((c) => (
                <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{c.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {KIND_LABELS[c.kind] ?? c.kind}
                    </span>
                  </div>
                  {c.description && (
                    <p className="mt-1 text-sm text-slate-600">{c.description}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {[
                      c.event,
                      c.occurredOn?.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
                      c.hours ? `${c.hours} hours` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
