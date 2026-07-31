import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { InstitutionSearch } from "./InstitutionSearch";

export const metadata: Metadata = {
  title: "Institutions & Clubs",
  description:
    "Schools, colleges, universities, and AI clubs taking part in BdAIO across Bangladesh.",
};

// Filters come from the query string, so this page must render per request.
export const dynamic = "force-dynamic";

const TYPE_LABELS = {
  SCHOOL: "School",
  COLLEGE: "College",
  UNIVERSITY: "University",
  CLUB: "Club",
  COMMUNITY: "Community",
} as const;

export default async function InstitutionsPage(
  props: PageProps<"/institutions">,
) {
  const { q, division, district } = await props.searchParams;
  const search = typeof q === "string" ? q.trim() : "";

  // Only approved institutions are ever public; filters narrow within that.
  const institutions = await db.institution.findMany({
    where: {
      status: "APPROVED",
      ...(typeof district === "string" && district
        ? { district }
        : typeof division === "string" && division
          ? { division }
          : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { nameBn: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { memberships: { where: { status: "APPROVED" } } } },
    },
  });

  return (
    <section className="bg-slate-50/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            Institutions & Clubs
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Schools, colleges, universities, and AI clubs taking part in BdAIO.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
          <Link
            href="/institutions/register"
            className="mt-6 inline-block rounded-lg bg-bdaio-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
          >
            Register your institution
          </Link>
        </div>

        <InstitutionSearch />

        {institutions.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            {search || division || district
              ? "No institutions match your search."
              : "No institutions have been approved yet."}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <Link
                key={institution.id}
                href={`/institutions/${institution.slug}`}
                className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-bdaio-blue/10 px-2.5 py-0.5 text-xs font-semibold text-bdaio-blue">
                    {TYPE_LABELS[institution.type]}
                  </span>
                  {institution.verified && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      ✓ verified
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-base font-bold text-slate-900">
                  {institution.name}
                </h2>
                {institution.nameBn && (
                  <p className="font-bengali text-sm text-slate-500">
                    {institution.nameBn}
                  </p>
                )}
                {institution.district && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {institution.district}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {institution._count.memberships}{" "}
                  {institution._count.memberships === 1 ? "member" : "members"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
