import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Programs · Admin" };

export default async function AdminProgramsPage() {
  const programs = await db.program.findMany({
    orderBy: [{ active: "desc" }, { title: "asc" }],
    include: { _count: { select: { events: true } } },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Programs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Recurring competition series and workshop tracks.
          </p>
        </div>
        <Link
          href="/admin/programs/new"
          className="rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
        >
          New program
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Program</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Scope</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Editions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {programs.map((program) => (
              <tr key={program.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{program.title}</p>
                  <p className="font-mono text-xs text-slate-500">{program.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-700">{program.scope}</span>
                  {program.isExternal && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      external
                    </span>
                  )}
                  {!program.active && (
                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                      inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{program._count.events}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/programs/${program.id}`}
                    className="text-sm font-semibold text-bdaio-blue hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No programs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
