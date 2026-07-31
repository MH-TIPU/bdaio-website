import type { Metadata } from "next";
import Link from "next/link";
import { ProgramForm } from "@/components/admin/ProgramForm";

export const metadata: Metadata = { title: "New program · Admin" };

export default function NewProgramPage() {
  return (
    <>
      <Link
        href="/admin/programs"
        className="text-sm font-medium text-bdaio-blue hover:underline"
      >
        ← Programs
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">New program</h1>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <ProgramForm
          defaults={{
            title: "",
            titleBn: "",
            slug: "",
            description: "",
            scope: "NATIONAL",
            isExternal: false,
            active: true,
          }}
        />
      </div>
    </>
  );
}
