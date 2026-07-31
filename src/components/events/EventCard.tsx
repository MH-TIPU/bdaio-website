import Link from "next/link";
import type { EventMode, EventStatus, EventType } from "@/generated/prisma/enums";

export const TYPE_LABELS: Record<EventType, string> = {
  OLYMPIAD_EDITION: "Olympiad",
  REGIONAL_ROUND: "Regional round",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  COURSE: "Course",
  BOOTCAMP: "Bootcamp",
};

export const MODE_LABELS: Record<EventMode, string> = {
  ONLINE: "Online",
  OFFLINE: "In person",
  HYBRID: "Hybrid",
};

export function formatDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function StatusPill({ status }: { status: EventStatus }) {
  const styles: Record<EventStatus, string> = {
    OPEN: "bg-emerald-50 text-emerald-700",
    RUNNING: "bg-amber-50 text-amber-700",
    ARCHIVED: "bg-slate-100 text-slate-600",
    DRAFT: "bg-slate-100 text-slate-600",
  };
  const labels: Record<EventStatus, string> = {
    OPEN: "Open",
    RUNNING: "In progress",
    ARCHIVED: "Past",
    DRAFT: "Draft",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export type EventCardData = {
  slug: string;
  title: string;
  type: EventType;
  mode: EventMode;
  status: EventStatus;
  description: string | null;
  venue: string | null;
  startsAt: Date | null;
  program: { title: string; slug: string };
};

export function EventCard({ event }: { event: EventCardData }) {
  const when = formatDate(event.startsAt);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-bdaio-blue/10 px-2.5 py-0.5 text-xs font-semibold text-bdaio-blue">
          {TYPE_LABELS[event.type]}
        </span>
        <StatusPill status={event.status} />
      </div>

      <h3 className="mt-3 text-base font-bold text-slate-900">{event.title}</h3>
      <p className="mt-0.5 text-xs font-medium text-slate-500">
        {event.program.title}
      </p>

      {event.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
          {event.description}
        </p>
      )}

      <dl className="mt-3 space-y-1 text-xs text-slate-500">
        {when && (
          <div>
            <dt className="sr-only">Date</dt>
            <dd>{when}</dd>
          </div>
        )}
        <div>
          <dt className="sr-only">Format</dt>
          <dd>
            {MODE_LABELS[event.mode]}
            {event.venue ? ` · ${event.venue}` : ""}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
