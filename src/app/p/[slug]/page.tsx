import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await db.page.findUnique({
    where: { slug },
    select: { title: true, body: true, published: true },
  });
  if (!page || !page.published) return { title: "Page not found" };
  return { title: page.title, description: page.body.slice(0, 155) };
}

/** Renders CMS content. Unpublished pages 404 for everyone. */
export default async function CmsPage(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const page = await db.page.findUnique({ where: { slug } });
  if (!page || !page.published) notFound();

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-bdaio-blue sm:text-4xl">
          {page.title}
        </h1>
        {page.titleBn && (
          <p className="font-bengali mt-1 text-lg text-slate-500">{page.titleBn}</p>
        )}
        <div className="mt-6 space-y-4">
          {page.body.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="text-base leading-relaxed text-slate-700">
              {para}
            </p>
          ))}
        </div>
        {page.bodyBn && (
          <div className="mt-8 space-y-4 border-t border-slate-100 pt-8">
            {page.bodyBn.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="font-bengali text-base leading-relaxed text-slate-700">
                {para}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
