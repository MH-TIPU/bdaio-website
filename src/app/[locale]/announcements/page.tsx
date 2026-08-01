import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { visibleAnnouncements } from "@/lib/cms/announcements";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Latest notices and updates from the Bangladesh AI Olympiad.",
};

// Depends on who is signed in, so it cannot be prerendered.
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  const announcements = await visibleAnnouncements(user, 50);

  return (
    <section className="bg-slate-50/50 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            Announcements
          </h1>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        {announcements.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            No announcements right now.
          </p>
        ) : (
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li
                key={a.id}
                className={`rounded-xl bg-white p-6 shadow-sm ring-1 ${
                  a.pinned ? "ring-bdaio-blue/30" : "ring-slate-100"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {a.pinned && (
                    <span className="rounded-full bg-bdaio-blue/10 px-2.5 py-0.5 text-xs font-semibold text-bdaio-blue">
                      Pinned
                    </span>
                  )}
                  <time className="text-xs text-slate-500">
                    {(a.publishAt ?? a.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </div>

                <h2 className="mt-2 text-lg font-bold text-slate-900">{a.title}</h2>
                {a.titleBn && (
                  <p className="font-bengali text-slate-600">{a.titleBn}</p>
                )}

                {a.body.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="mt-2 text-sm leading-relaxed text-slate-700">
                    {para}
                  </p>
                ))}
                {a.bodyBn &&
                  a.bodyBn.split(/\n{2,}/).map((para, i) => (
                    <p
                      key={`bn-${i}`}
                      className="font-bengali mt-2 text-sm leading-relaxed text-slate-600"
                    >
                      {para}
                    </p>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
