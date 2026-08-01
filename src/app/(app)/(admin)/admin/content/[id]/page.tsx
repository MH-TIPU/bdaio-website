import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageForm } from "@/components/admin/PageForm";

export const metadata: Metadata = { title: "Edit page · Admin" };

export default async function EditContentPage(props: PageProps<"/admin/content/[id]">) {
  const { id } = await props.params;
  const page = await db.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <>
      <Link href="/admin/content" className="text-sm font-medium text-bdaio-blue hover:underline">
        ← Content
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">{page.title}</h1>
        <Link
          href={`/p/${page.slug}`}
          className="text-sm font-semibold text-bdaio-blue hover:underline"
        >
          View public page
        </Link>
      </div>
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <PageForm
          defaults={{
            id: page.id,
            slug: page.slug,
            title: page.title,
            titleBn: page.titleBn ?? "",
            body: page.body,
            bodyBn: page.bodyBn ?? "",
            published: page.published,
          }}
        />
      </div>
    </>
  );
}
