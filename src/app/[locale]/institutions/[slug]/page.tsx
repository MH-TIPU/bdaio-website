import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { JsonLd } from "@/components/JsonLd";
import { institutionJsonLd, metaDescription, pageMetadata } from "@/lib/seo";
import { PAGE } from "@/lib/layout";

export const revalidate = 60;

export async function generateMetadata(
  props: PageProps<"/[locale]/institutions/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const institution = await db.institution.findUnique({
    where: { slug },
    select: { name: true, description: true, status: true, logo: true, updatedAt: true },
  });
  // A pending institution is invisible everywhere, including here.
  if (!institution || institution.status !== "APPROVED") {
    return { title: "Institution not found", robots: { index: false } };
  }
  return pageMetadata({
    locale,
    title: institution.name,
    description: metaDescription(institution.description),
    path: `/institutions/${slug}`,
    image: institution.logo,
    modifiedTime: institution.updatedAt,
  });
}

export default async function InstitutionPage(
  props: PageProps<"/[locale]/institutions/[slug]">,
) {
  const { slug } = await props.params;

  const institution = await db.institution.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { status: "APPROVED" },
        include: {
          user: {
            select: {
              profile: {
                select: { handle: true, fullName: true, visibility: true },
              },
            },
          },
        },
      },
    },
  });

  // Pending and rejected institutions are not public.
  if (!institution || institution.status !== "APPROVED") notFound();

  const moderators = institution.memberships.filter(
    (m) => m.membershipRole === "MODERATOR",
  );
  const verifiedCount = institution.memberships.filter((m) => m.verified).length;

  // Only members who opted into a public profile are listed by name.
  const publicMembers = institution.memberships.filter(
    (m) => m.user.profile?.visibility === "PUBLIC" && m.user.profile.handle,
  );

  return (
    <section className="bg-slate-50/50 py-16">
      <JsonLd data={institutionJsonLd(institution)} />
      <div className={PAGE}>
        <Link
          href="/institutions"
          className="text-sm font-medium text-bdaio-blue hover:underline"
        >
          ← Institutions
        </Link>

        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-bdaio-blue/10 px-2.5 py-0.5 text-xs font-semibold text-bdaio-blue">
              {institution.type.charAt(0) + institution.type.slice(1).toLowerCase()}
            </span>
            {institution.verified && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                ✓ verified institution
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-black text-bdaio-blue">
            {institution.name}
          </h1>
          {institution.nameBn && (
            <p className="font-bengali mt-1 text-lg text-slate-500">
              {institution.nameBn}
            </p>
          )}
          {institution.district && (
            <p className="mt-1 text-sm text-slate-500">{institution.district}</p>
          )}
          {institution.description && (
            <p className="mt-4 text-slate-700">{institution.description}</p>
          )}
          {institution.website && (
            <p className="mt-3 text-sm">
              <a
                href={institution.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-medium text-bdaio-blue hover:underline"
              >
                Visit website
              </a>
            </p>
          )}

          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Members
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-slate-900">
                {institution.memberships.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Verified students
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-slate-900">
                {verifiedCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Moderators
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-slate-900">
                {moderators.length}
              </dd>
            </div>
          </dl>
        </div>

        {publicMembers.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Members</h2>
            <p className="mt-1 text-xs text-slate-500">
              Only members who chose a public profile are listed.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {publicMembers.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/u/${m.user.profile!.handle}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  >
                    {m.user.profile!.fullName}
                    {m.verified && (
                      <span className="text-xs font-semibold text-emerald-700">✓</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
