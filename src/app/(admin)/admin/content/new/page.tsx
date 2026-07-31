import type { Metadata } from "next";
import Link from "next/link";
import { PageForm } from "@/components/admin/PageForm";

export const metadata: Metadata = { title: "New page · Admin" };

export default function NewContentPage() {
  return (
    <>
      <Link href="/admin/content" className="text-sm font-medium text-bdaio-blue hover:underline">
        ← Content
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">New page</h1>
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <PageForm
          defaults={{ slug: "", title: "", titleBn: "", body: "", bodyBn: "", published: true }}
        />
      </div>
    </>
  );
}
