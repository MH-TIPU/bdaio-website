import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "My Activity" };

// Machine action names → sentences a participant can actually read.
const LABELS: Record<string, string> = {
  "user.registered": "Created your BdAIO account",
  "user.logged_in": "Signed in",
  "user.email_verified": "Verified your email address",
  "user.password_reset_requested": "Requested a password reset",
  "user.password_reset": "Changed your password",
  "profile.updated": "Updated your profile",
  "registration.created": "Registered for an event",
  "registration.waitlisted": "Joined an event waitlist",
  "registration.withdrawn": "Withdrew from an event",
  "institution.registered": "Submitted an institution for review",
  "membership.requested": "Requested to join an institution",
  "membership.approved": "Approved an institution membership",
  "membership.rejected": "Rejected an institution membership",
  "membership.verified": "Verified a student",
  "membership.unverified": "Removed a student verification",
  "community_role.applied": "Applied for a community role",
  "community_role.approved": "Approved a community role",
  "community_role.rejected": "Rejected a community role",
  "contribution.logged": "Recorded a contribution",
};

function describe(action: string): string {
  return LABELS[action] ?? action.replace(/[._]/g, " ");
}

export default async function ActivityPage() {
  const user = await requireUser();

  const entries = await db.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Activity</h1>
      <p className="mt-1 text-sm text-slate-600">
        A record of what has happened on your account.
      </p>

      {entries.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          Nothing recorded yet.
        </p>
      ) : (
        <ol className="mt-6 space-y-1">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100"
            >
              <span className="text-sm text-slate-800">{describe(entry.action)}</span>
              <span className="text-xs text-slate-500">
                {entry.createdAt.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
