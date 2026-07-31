import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { withdrawRegistration } from "@/server/registrations/actions";
import { formatDate, TYPE_LABELS } from "@/components/events/EventCard";
import type { RegistrationStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "My Registrations" };

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  APPLIED: "bg-blue-50 text-blue-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  WAITLISTED: "bg-amber-50 text-amber-800",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-slate-100 text-slate-600",
};

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  APPLIED: "Submitted",
  APPROVED: "Confirmed",
  WAITLISTED: "Waitlisted",
  REJECTED: "Not accepted",
  WITHDRAWN: "Withdrawn",
};

export default async function RegistrationsPage() {
  const user = await requireUser();

  const registrations = await db.registration.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      event: { include: { program: { select: { title: true } } } },
      round: { select: { name: true } },
    },
  });

  const active = registrations.filter((r) => r.status !== "WITHDRAWN");
  const withdrawn = registrations.filter((r) => r.status === "WITHDRAWN");

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Registrations</h1>
      <p className="mt-1 text-sm text-slate-600">
        Every olympiad round and workshop you have signed up for.
      </p>

      {registrations.length === 0 ? (
        <div className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-600">
            You have not registered for anything yet.
          </p>
          <Link
            href="/events"
            className="mt-3 inline-block text-sm font-semibold text-bdaio-blue hover:underline"
          >
            Browse events
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {active.map((registration) => (
            <li
              key={registration.id}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[registration.status]}`}
                    >
                      {STATUS_LABELS[registration.status]}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {TYPE_LABELS[registration.event.type]}
                    </span>
                  </div>

                  <Link
                    href={`/events/${registration.event.slug}`}
                    className="mt-2 block text-base font-bold text-slate-900 hover:text-bdaio-blue"
                  >
                    {registration.event.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {registration.event.program.title}
                    {registration.round ? ` · ${registration.round.name}` : ""}
                  </p>
                  {registration.event.startsAt && (
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(registration.event.startsAt)}
                    </p>
                  )}
                </div>

                <form action={withdrawRegistration}>
                  <input
                    type="hidden"
                    name="registrationId"
                    value={registration.id}
                  />
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
                  >
                    Withdraw
                  </button>
                </form>
              </div>
            </li>
          ))}

          {withdrawn.length > 0 && (
            <li className="pt-2">
              <h2 className="text-sm font-semibold text-slate-500">Withdrawn</h2>
              <ul className="mt-2 space-y-2">
                {withdrawn.map((registration) => (
                  <li
                    key={registration.id}
                    className="rounded-lg bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-100"
                  >
                    {registration.event.title}
                    {registration.round ? ` · ${registration.round.name}` : ""}
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      )}
    </>
  );
}
