import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { BadgeChip } from "@/components/community/BadgeChip";
import { RoleApplicationForm } from "./RoleApplicationForm";

export const metadata: Metadata = { title: "My Roles" };

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
} as const;

export default async function RolesPage() {
  const user = await requireUser();

  const [applications, memberships, badges] = await Promise.all([
    db.communityRole.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    // Only institutions where this user is an approved member can be scoped to.
    db.institutionMembership.findMany({
      where: { userId: user.id, status: "APPROVED" },
      include: { institution: { select: { id: true, name: true } } },
    }),
    db.badge.findMany({
      where: { userId: user.id },
      orderBy: { awardedAt: "desc" },
    }),
  ]);

  const scopeOptions = memberships.map((m) => m.institution);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Roles</h1>
      <p className="mt-1 text-sm text-slate-600">
        Volunteer, mentor, or contribute — recognised roles appear on your public
        profile.
      </p>

      {badges.length > 0 && (
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">My badges</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <BadgeChip key={badge.id} type={badge.type} title={badge.title} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">My applications</h2>
        {applications.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            You have not applied for a community role yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {applications.map((app) => (
              <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {app.type.charAt(0) + app.type.slice(1).toLowerCase()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {app.institutionId ? "Institution-scoped" : "BdAIO-wide"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[app.status]}`}
                >
                  {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Apply for a role</h2>
        <div className="mt-4">
          <RoleApplicationForm institutions={scopeOptions} />
        </div>
      </div>
    </>
  );
}
