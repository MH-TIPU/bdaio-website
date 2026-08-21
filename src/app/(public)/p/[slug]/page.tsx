import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { metaDescription, pageMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await db.page.findUnique({
    where: { slug },
    select: { title: true, body: true, published: true, updatedAt: true },
  });
  if (!page || !page.published) {
    return { title: "Page not found", robots: { index: false } };
  }
  return pageMetadata({
    locale: "en",
    title: page.title,
    description: metaDescription(page.body),
    path: `/p/${slug}`,
    type: "article",
    modifiedTime: page.updatedAt,
  });
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
        <div className="mt-6">
          {page.body.startsWith("<") ? (
            <div
              className="prose prose-slate max-w-none text-base leading-relaxed text-slate-700"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          ) : (
            <div className="space-y-4">
              {page.body.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="text-base leading-relaxed text-slate-700">
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
