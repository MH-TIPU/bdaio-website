import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { deleteAnnouncement } from "@/server/cms/actions";

export const metadata: Metadata = { title: "Announcements · Admin" };

export default async function AdminAnnouncementsPage() {
  const announcements = await db.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const now = new Date();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="mt-1 text-sm text-slate-600">
            Notices shown on the site. Scheduled ones stay hidden until their
            publish time.
          </p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-bdaio-blue-dark"
        >
          New announcement
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {announcements.map((a) => {
          const scheduled = a.publishAt && a.publishAt > now;
          const expired = a.expiresAt && a.expiresAt < now;
          const live = a.published && !scheduled && !expired;

          return (
            <li key={a.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    {a.pinned && (
                      <span className="rounded-full bg-bdaio-blue/10 px-2 py-0.5 text-xs font-semibold text-bdaio-blue">
                        pinned
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        live
                          ? "bg-emerald-50 text-emerald-700"
                          : scheduled
                            ? "bg-blue-50 text-blue-700"
                            : expired
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {live ? "Live" : scheduled ? "Scheduled" : expired ? "Expired" : "Draft"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {a.audience.charAt(0) + a.audience.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.body}</p>
                  {a.publishAt && (
                    <p className="mt-1 text-xs text-slate-500">
                      Publishes {a.publishAt.toLocaleString("en-GB")}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/admin/announcements/${a.id}`}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-bdaio-blue ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  <form action={deleteAnnouncement}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}

        {announcements.length === 0 && (
          <li className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
            No announcements yet.
          </li>
        )}
      </ul>
    </>
  );
}
