import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const [
    programs,
    events,
    openEvents,
    users,
    pending,
    waitlisted,
    approved,
    recent,
  ] = await Promise.all([
    db.program.count(),
    db.event.count(),
    db.event.count({ where: { status: "OPEN" } }),
    db.user.count(),
    db.registration.count({ where: { status: "APPLIED" } }),
    db.registration.count({ where: { status: "WAITLISTED" } }),
    db.registration.count({ where: { status: "APPROVED" } }),
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const stats = [
    { label: "Programs", value: programs, href: "/admin/programs" },
    { label: "Events", value: events, hint: `${openEvents} open`, href: "/admin/events" },
    { label: "Accounts", value: users },
    {
      label: "Awaiting review",
      value: pending,
      hint: `${waitlisted} waitlisted · ${approved} approved`,
      href: "/admin/registrations?status=APPLIED",
      highlight: pending > 0,
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
      <p className="mt-1 text-sm text-slate-600">
        Everything running across BdAIO right now.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const inner = (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
              <p
                className={`mt-1 text-2xl font-bold ${stat.highlight ? "text-amber-600" : "text-slate-900"}`}
              >
                {stat.value}
              </p>
              {stat.hint && (
                <p className="mt-0.5 text-xs text-slate-500">{stat.hint}</p>
              )}
            </>
          );
          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={stat.label}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing logged yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {recent.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2"
              >
                <span className="font-mono text-xs text-slate-700">
                  {entry.action}
                </span>
                <span className="text-xs text-slate-500">
                  {entry.user?.email ?? "system"} ·{" "}
                  {entry.createdAt.toLocaleString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
