import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  eligibilityProblems,
  hasRounds,
  isFull,
  isLearningEvent,
  seatsTaken,
  windowState,
  WINDOW_MESSAGES,
} from "@/lib/events/registration";
import {
  MODE_LABELS,
  StatusPill,
  TYPE_LABELS,
  formatDate,
} from "@/components/events/EventCard";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, eventJsonLd, metaDescription, pageMetadata } from "@/lib/seo";
import { RegisterPanel } from "./RegisterPanel";
import { PAGE } from "@/lib/layout";

export async function generateMetadata(
  props: PageProps<"/[locale]/events/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const event = await db.event.findUnique({
    where: { slug },
    select: { title: true, description: true, banner: true, status: true, updatedAt: true },
  });
  if (!event) return { title: "Event not found", robots: { index: false } };
  return pageMetadata({
    locale,
    title: event.title,
    description: metaDescription(event.description),
    path: `/events/${slug}`,
    image: event.banner,
    type: "article",
    // A draft event 404s below; keep it out of search results either way.
    index: event.status !== "DRAFT",
    modifiedTime: event.updatedAt,
  });
}

export default async function EventPage(props: PageProps<"/[locale]/events/[slug]">) {
  const { slug } = await props.params;

  const event = await db.event.findUnique({
    where: { slug },
    include: {
      program: true,
      rounds: { orderBy: { order: "asc" } },
    },
  });

  if (!event || event.status === "DRAFT") notFound();

  const user = await getCurrentUser();

  const [applied, approved] = await Promise.all([
    db.registration.count({ where: { eventId: event.id, status: "APPLIED" } }),
    db.registration.count({ where: { eventId: event.id, status: "APPROVED" } }),
  ]);
  const taken = seatsTaken({ applied, approved });
  const full = isFull(event.capacity, taken);

  const state = windowState(event, {
    opensAt: event.regOpensAt,
    closesAt: event.regClosesAt,
  });

  const existing = user
    ? await db.registration.findFirst({
        where: { userId: user.id, eventId: event.id, status: { not: "WITHDRAWN" } },
        select: { status: true },
      })
    : null;

  const profile = user
    ? await db.profile.findUnique({
        where: { userId: user.id },
        select: {
          dateOfBirth: true,
          institutionId: true,
          guardian: { select: { id: true } },
        },
      })
    : null;

  const problems = user
    ? eligibilityProblems({
        emailVerified: Boolean(user.emailVerifiedAt),
        profile,
        eventType: event.type,
      })
    : [];

  const when = formatDate(event.startsAt);
  const closes = formatDate(event.regClosesAt);
  const verb = isLearningEvent(event.type) ? "Enrol" : "Register";

  return (
    <section className="bg-slate-50/50 py-16">
      {/* schema.org/Event requires a start date; markup is omitted rather than
          emitted invalid for an event whose schedule isn't set yet. */}
      {event.startsAt && <JsonLd data={eventJsonLd(event)} />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Events", path: "/events" },
          { name: event.program.title, path: `/programs/${event.program.slug}` },
          { name: event.title, path: `/events/${event.slug}` },
        ])}
      />
      <div className={PAGE}>
        <Link
          href={`/programs/${event.program.slug}`}
          className="text-sm font-medium text-bdaio-blue hover:underline"
        >
          ← {event.program.title}
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-bdaio-blue/10 px-2.5 py-0.5 text-xs font-semibold text-bdaio-blue">
            {TYPE_LABELS[event.type]}
          </span>
          <StatusPill status={event.status} />
        </div>

        <h1 className="mt-3 text-3xl font-black text-bdaio-blue sm:text-4xl">
          {event.title}
        </h1>
        {event.titleBn && (
          <p className="font-bengali mt-1 text-lg text-slate-500">{event.titleBn}</p>
        )}
        {event.description && (
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            {event.description}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <dl className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:grid-cols-2">
              {when && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Date
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-900">{when}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Format
                </dt>
                <dd className="mt-0.5 text-sm text-slate-900">
                  {MODE_LABELS[event.mode]}
                </dd>
              </div>
              {event.venue && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Venue
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-900">{event.venue}</dd>
                </div>
              )}
              {event.capacity !== null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Places
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-900">
                    {Math.max(event.capacity - taken, 0)} of {event.capacity}{" "}
                    remaining
                  </dd>
                </div>
              )}
              {closes && state === "open" && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Registration closes
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-900">{closes}</dd>
                </div>
              )}
              {event.feeBdt !== null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Fee
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-900">
                    ৳{event.feeBdt}
                  </dd>
                </div>
              )}
            </dl>

            {hasRounds(event.type) && event.rounds.length > 0 && (
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Rounds</h2>
                <ol className="mt-3 space-y-3">
                  {event.rounds.map((round) => (
                    <li key={round.id} className="border-l-2 border-slate-100 pl-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {round.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {MODE_LABELS[round.mode]}
                        {round.venue ? ` · ${round.venue}` : ""}
                        {round.startsAt ? ` · ${formatDate(round.startsAt)}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Registration panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                {verb === "Enrol" ? "Enrolment" : "Registration"}
              </h2>

              <div className="mt-3">
                {existing ? (
                  <div className="rounded-lg bg-emerald-50 px-3 py-2.5">
                    <p className="text-sm text-emerald-800">
                      {existing.status === "WAITLISTED"
                        ? "You are on the waitlist for this event."
                        : "You are registered for this event."}
                    </p>
                    <Link
                      href="/dashboard/registrations"
                      className="mt-1 inline-block text-sm font-semibold text-emerald-900 underline underline-offset-2"
                    >
                      Manage
                    </Link>
                  </div>
                ) : state !== "open" ? (
                  <p className="text-sm text-slate-600">{WINDOW_MESSAGES[state]}</p>
                ) : !user ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Sign in to your BdAIO account to {verb.toLowerCase()}.
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex w-full items-center justify-center rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
                    >
                      Sign in
                    </Link>
                    <p className="text-center text-xs text-slate-500">
                      New here?{" "}
                      <Link href="/register" className="font-semibold text-bdaio-blue hover:underline">
                        Create an account
                      </Link>
                    </p>
                  </div>
                ) : problems.length > 0 ? (
                  <div className="space-y-3">
                    <ul className="space-y-1.5">
                      {problems.map((problem) => (
                        <li key={problem.code} className="text-sm text-amber-800">
                          {problem.message}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={
                        problems[0].code === "email_unverified"
                          ? "/dashboard"
                          : "/dashboard/profile"
                      }
                      className="inline-flex w-full items-center justify-center rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
                    >
                      {problems[0].code === "email_unverified"
                        ? "Verify my email"
                        : "Complete my profile"}
                    </Link>
                  </div>
                ) : (
                  <>
                    {full && (
                      <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        This event is full. You can still join the waitlist.
                      </p>
                    )}
                    <RegisterPanel
                      eventId={event.id}
                      rounds={hasRounds(event.type) ? event.rounds : []}
                      verb={verb}
                      full={full}
                    />
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
