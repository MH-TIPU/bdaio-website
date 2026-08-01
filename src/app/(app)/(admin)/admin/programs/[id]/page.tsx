import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProgramForm } from "@/components/admin/ProgramForm";

export const metadata: Metadata = { title: "Edit program · Admin" };

export default async function EditProgramPage(
  props: PageProps<"/admin/programs/[id]">,
) {
  const { id } = await props.params;
  const program = await db.program.findUnique({ where: { id } });
  if (!program) notFound();

  return (
    <>
      <Link
        href="/admin/programs"
        className="text-sm font-medium text-bdaio-blue hover:underline"
      >
        ← Programs
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">{program.title}</h1>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <ProgramForm
          defaults={{
            id: program.id,
            title: program.title,
            titleBn: program.titleBn ?? "",
            slug: program.slug,
            description: program.description ?? "",
            scope: program.scope,
            isExternal: program.isExternal,
            active: program.active,
          }}
        />
      </div>
    </>
  );
}
