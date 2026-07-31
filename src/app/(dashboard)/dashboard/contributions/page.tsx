import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { deleteContribution } from "@/server/community/actions";
import { ContributionForm } from "./ContributionForm";

export const metadata: Metadata = { title: "My Contributions" };

const KIND_LABELS: Record<string, string> = {
  ORGANIZING: "Organising",
  MENTORING: "Mentoring",
  CONTENT: "Content",
  TRANSLATION: "Translation",
  JUDGING: "Judging",
  OTHER: "Other",
};

export default async function ContributionsPage() {
  const user = await requireUser();

  const [contributions, events, approvedRoles] = await Promise.all([
    db.contribution.findMany({
      where: { userId: user.id },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
      include: { event: { select: { title: true } } },
    }),
    db.event.findMany({
      orderBy: [{ year: "desc" }, { title: "asc" }],
      select: { id: true, title: true },
      take: 50,
    }),
    db.communityRole.count({ where: { userId: user.id, status: "APPROVED" } }),
  ]);

  const totalHours = contributions.reduce((sum, c) => sum + (c.hours ?? 0), 0);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Contributions</h1>
      <p className="mt-1 text-sm text-slate-600">
        What you have done for BdAIO. These appear on your public profile.
      </p>

      {approvedRoles === 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Contributions can be recorded once you hold an approved volunteer,
          mentor, or contributor role.{" "}
          <Link href="/dashboard/roles" className="font-semibold underline">
            Apply for a role
          </Link>
          .
        </p>
      )}

      {contributions.length > 0 && (
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {contributions.length}{" "}
              {contributions.length === 1 ? "contribution" : "contributions"}
            </h2>
            {totalHours > 0 && (
              <p className="text-sm text-slate-600">{totalHours} hours logged</p>
            )}
          </div>

          <ul className="mt-3 divide-y divide-slate-100">
            {contributions.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
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
                      c.event?.title,
                      c.occurredOn?.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                      c.hours ? `${c.hours} hours` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <form action={deleteContribution}>
                  <input type="hidden" name="contributionId" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {approvedRoles > 0 && (
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Add a contribution</h2>
          <div className="mt-4">
            <ContributionForm events={events} />
          </div>
        </div>
      )}
    </>
  );
}
