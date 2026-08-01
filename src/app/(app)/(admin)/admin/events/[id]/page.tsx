import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EventForm } from "@/components/admin/EventForm";

export const metadata: Metadata = { title: "Edit event · Admin" };

/** Date → the `YYYY-MM-DDTHH:mm` shape a datetime-local input expects. */
function toLocalInput(value: Date | null): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default async function EditEventPage(props: PageProps<"/admin/events/[id]">) {
  const { id } = await props.params;

  const [event, programs] = await Promise.all([
    db.event.findUnique({ where: { id } }),
    db.program.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!event) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/events" className="text-sm font-medium text-bdaio-blue hover:underline">
          ← Events
        </Link>
        <div className="flex gap-3">
          <Link
            href={`/admin/events/${event.id}/rounds`}
            className="text-sm font-semibold text-slate-600 hover:underline"
          >
            Manage rounds
          </Link>
          <Link
            href={`/events/${event.slug}`}
            className="text-sm font-semibold text-bdaio-blue hover:underline"
          >
            View public page
          </Link>
        </div>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-slate-900">{event.title}</h1>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <EventForm
          programs={programs}
          defaults={{
            id: event.id,
            programId: event.programId,
            title: event.title,
            titleBn: event.titleBn ?? "",
            slug: event.slug,
            type: event.type,
            year: String(event.year),
            description: event.description ?? "",
            mode: event.mode,
            venue: event.venue ?? "",
            onlineUrl: event.onlineUrl ?? "",
            capacity: event.capacity === null ? "" : String(event.capacity),
            feeBdt: event.feeBdt === null ? "" : String(event.feeBdt),
            status: event.status,
            startsAt: toLocalInput(event.startsAt),
            endsAt: toLocalInput(event.endsAt),
            regOpensAt: toLocalInput(event.regOpensAt),
            regClosesAt: toLocalInput(event.regClosesAt),
          }}
        />
      </div>
    </>
  );
}
