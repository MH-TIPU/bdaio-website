import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import {
  decideMembership,
  setMembershipVerified,
  decideCommunityRole,
} from "@/server/community/actions";
import { JoinInstitutionForm } from "./JoinInstitutionForm";

export const metadata: Metadata = { title: "My Institution" };

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
} as const;

export default async function DashboardInstitutionPage(
  props: PageProps<"/dashboard/institution">,
) {
  const user = await requireUser();
  const params = await props.searchParams;

  const [myMemberships, institutions] = await Promise.all([
    db.institutionMembership.findMany({
      where: { userId: user.id },
      include: { institution: { select: { name: true, slug: true, status: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.institution.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Institutions this user moderates (approved moderator memberships only).
  const moderated = myMemberships.filter(
    (m) => m.membershipRole === "MODERATOR" && m.status === "APPROVED",
  );

  const consoles = await Promise.all(
    moderated.map(async (m) => {
      const [members, roleApplications] = await Promise.all([
        db.institutionMembership.findMany({
          where: { institutionId: m.institutionId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { fullName: true, classGrade: true } },
              },
            },
          },
          orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        }),
        db.communityRole.findMany({
          where: { institutionId: m.institutionId, status: "PENDING" },
          include: {
            user: {
              select: { email: true, profile: { select: { fullName: true } } },
            },
          },
        }),
      ]);
      return { membership: m, members, roleApplications };
    }),
  );

  const joinable = institutions.filter(
    (i) => !myMemberships.some((m) => m.institutionId === i.id),
  );

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Institution</h1>
      <p className="mt-1 text-sm text-slate-600">
        Link your account to your school, college, university, or club.
      </p>

      {params.submitted === "1" && (
        <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your institution has been submitted. BdAIO will review it, and you
          become its moderator once it is approved.
        </p>
      )}

      {/* My links */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">My links</h2>
        {myMemberships.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            You are not linked to an institution yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {myMemberships.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {m.institution.status === "APPROVED" ? (
                      <Link
                        href={`/institutions/${m.institution.slug}`}
                        className="hover:text-bdaio-blue hover:underline"
                      >
                        {m.institution.name}
                      </Link>
                    ) : (
                      m.institution.name
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.membershipRole.charAt(0) + m.membershipRole.slice(1).toLowerCase()}
                    {m.institution.status !== "APPROVED" &&
                      ` · institution ${m.institution.status.toLowerCase()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {m.verified && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      ✓ verified student
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[m.status]}`}
                  >
                    {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Join another */}
      {joinable.length > 0 && (
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Join an institution</h2>
          <p className="mt-1 text-xs text-slate-500">
            A moderator reviews your request and confirms you belong there.
          </p>
          <div className="mt-4">
            <JoinInstitutionForm institutions={joinable} />
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-slate-600">
        Not listed?{" "}
        <Link
          href="/institutions/register"
          className="font-semibold text-bdaio-blue hover:underline"
        >
          Register your institution
        </Link>
        .
      </p>

      {/* Moderator console */}
      {consoles.map(({ membership, members, roleApplications }) => (
        <div key={membership.id} className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">
            Moderating {membership.institution.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Approve members, and verify that students really belong to your
            institution — verification is what grants their badge.
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Person</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Role</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {m.user.profile?.fullName ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {m.user.email}
                        {m.user.profile?.classGrade
                          ? ` · ${m.user.profile.classGrade}`
                          : ""}
                      </p>
                      {m.note && (
                        <p className="mt-1 text-xs italic text-slate-500">
                          &ldquo;{m.note}&rdquo;
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {m.membershipRole.charAt(0) + m.membershipRole.slice(1).toLowerCase()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[m.status]}`}
                      >
                        {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                      </span>
                      {m.verified && (
                        <span className="ml-1.5 text-xs font-semibold text-emerald-700">
                          ✓
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        {m.status === "PENDING" && (
                          <>
                            <form action={decideMembership}>
                              <input type="hidden" name="membershipId" value={m.id} />
                              <input type="hidden" name="decision" value="APPROVED" />
                              <button
                                type="submit"
                                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                              >
                                Approve
                              </button>
                            </form>
                            <form action={decideMembership}>
                              <input type="hidden" name="membershipId" value={m.id} />
                              <input type="hidden" name="decision" value="REJECTED" />
                              <button
                                type="submit"
                                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                              >
                                Reject
                              </button>
                            </form>
                          </>
                        )}
                        {m.status === "APPROVED" &&
                          m.user.id !== user.id && (
                            <form action={setMembershipVerified}>
                              <input type="hidden" name="membershipId" value={m.id} />
                              <input
                                type="hidden"
                                name="verified"
                                value={m.verified ? "0" : "1"}
                              />
                              <button
                                type="submit"
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${
                                  m.verified
                                    ? "text-slate-600 ring-slate-200 hover:bg-slate-50"
                                    : "text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
                                }`}
                              >
                                {m.verified ? "Unverify" : "Verify student"}
                              </button>
                            </form>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {roleApplications.length > 0 && (
            <div className="mt-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Volunteer applications
              </h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {roleApplications.map((app) => (
                  <li key={app.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {app.user.profile?.fullName ?? app.user.email} —{" "}
                          {app.type.charAt(0) + app.type.slice(1).toLowerCase()}
                        </p>
                        {app.motivation && (
                          <p className="mt-1 text-sm text-slate-600">
                            {app.motivation}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <form action={decideCommunityRole}>
                          <input type="hidden" name="roleId" value={app.id} />
                          <input type="hidden" name="decision" value="APPROVED" />
                          <button
                            type="submit"
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={decideCommunityRole}>
                          <input type="hidden" name="roleId" value={app.id} />
                          <input type="hidden" name="decision" value="REJECTED" />
                          <button
                            type="submit"
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
