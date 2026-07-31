import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { EventForm } from "@/components/admin/EventForm";

export const metadata: Metadata = { title: "New event · Admin" };

export default async function NewEventPage() {
  const programs = await db.program.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <>
      <Link href="/admin/events" className="text-sm font-medium text-bdaio-blue hover:underline">
        ← Events
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">New event</h1>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        {programs.length === 0 ? (
          <p className="text-sm text-slate-600">
            Create a program first —{" "}
            <Link href="/admin/programs/new" className="font-semibold text-bdaio-blue hover:underline">
              add one
            </Link>
            .
          </p>
        ) : (
          <EventForm
            programs={programs}
            defaults={{
              programId: programs[0].id,
              title: "",
              titleBn: "",
              slug: "",
              type: "WORKSHOP",
              year: String(new Date().getFullYear()),
              description: "",
              mode: "OFFLINE",
              venue: "",
              onlineUrl: "",
              capacity: "",
              feeBdt: "",
              status: "DRAFT",
              startsAt: "",
              endsAt: "",
              regOpensAt: "",
              regClosesAt: "",
            }}
          />
        )}
      </div>
    </>
  );
}
