import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { markNotificationsRead } from "@/server/journey/actions";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">
            {unread > 0 ? `${unread} unread` : "You are up to date."}
          </p>
        </div>
        {unread > 0 && (
          <form action={markNotificationsRead}>
            <button
              type="submit"
              className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          No notifications yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl p-4 shadow-sm ring-1 ${
                n.readAt
                  ? "bg-white ring-slate-100"
                  : "bg-blue-50/60 ring-blue-100"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {!n.readAt && (
                      <span
                        aria-label="unread"
                        className="mr-1.5 inline-block h-2 w-2 rounded-full bg-bdaio-blue align-middle"
                      />
                    )}
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                  )}
                  {n.href && (
                    <Link
                      href={n.href}
                      className="mt-1 inline-block text-sm font-semibold text-bdaio-blue hover:underline"
                    >
                      Open
                    </Link>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {n.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
