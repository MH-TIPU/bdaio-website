import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { BadgeChip } from "@/components/community/BadgeChip";

export const metadata: Metadata = { title: "My Achievements" };

export default async function AchievementsPage() {
  const user = await requireUser();

  const [badges, verifiedMemberships, roles, registrations, profile] =
    await Promise.all([
      db.badge.findMany({
        where: { userId: user.id },
        orderBy: { awardedAt: "desc" },
        include: { event: { select: { title: true } } },
      }),
      db.institutionMembership.count({
        where: { userId: user.id, verified: true, status: "APPROVED" },
      }),
      db.communityRole.count({ where: { userId: user.id, status: "APPROVED" } }),
      db.registration.count({
        where: { userId: user.id, status: { in: ["APPROVED", "APPLIED"] } },
      }),
      db.profile.findUnique({
        where: { userId: user.id },
        select: { handle: true, visibility: true },
      }),
    ]);

  const stats = [
    { label: "Badges", value: badges.length },
    { label: "Events entered", value: registrations },
    { label: "Community roles", value: roles },
    { label: "Verified memberships", value: verifiedMemberships },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Achievements</h1>
      <p className="mt-1 text-sm text-slate-600">
        Badges, medals, and recognition you have earned.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Badges</h2>
        {badges.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No badges yet. Take part in an event, or join your institution and ask
            a moderator to verify you.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {badges.map((badge) => (
              <li key={badge.id} className="flex flex-wrap items-center justify-between gap-2">
                <BadgeChip type={badge.type} title={badge.title} />
                <span className="text-xs text-slate-500">
                  {badge.event?.title ? `${badge.event.title} · ` : ""}
                  {badge.awardedAt.toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {profile?.handle && profile.visibility === "PUBLIC" ? (
        <p className="mt-4 text-sm text-slate-600">
          These appear on your public profile at{" "}
          <Link
            href={`/u/${profile.handle}`}
            className="font-semibold text-bdaio-blue hover:underline"
          >
            /u/{profile.handle}
          </Link>
          .
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          Your profile is private.{" "}
          <Link
            href="/dashboard/profile"
            className="font-semibold text-bdaio-blue hover:underline"
          >
            Make it public
          </Link>{" "}
          to show these publicly.
        </p>
      )}
    </>
  );
}
