import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dictionaryFor, getDictionary, isLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth/dal";
import { pageMetadata } from "@/lib/seo";
import { PAGE } from "@/lib/layout";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/resources">,
): Promise<Metadata> {
  const { locale } = await params;
  const meta = dictionaryFor(locale).pages.resources;
  return pageMetadata({
    locale,
    path: "/resources",
    title: meta.title,
    description:
    "Syllabuses, guidelines, past problems, and learning materials for the Bangladesh AI Olympiad."
  });
}

const KIND_LABELS = {
  SYLLABUS: "Syllabus",
  GUIDELINE: "Guideline",
  PAST_PROBLEM: "Past problems",
  MATERIAL: "Material",
  DOWNLOAD: "Download",
  LINK: "Link",
} as const;

export default async function ResourcesPage({ params }: PageProps<"/[locale]/resources">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).pages.resources;

  const user = await getCurrentUser();

  // Members-only rows are filtered out of the *query* for guests, so restricted
  // titles and URLs never reach the client at all.
  const resources = await db.resource.findMany({
    where: {
      published: true,
      ...(user ? {} : { visibility: "PUBLIC" }),
    },
    orderBy: [{ category: { order: "asc" } }, { title: "asc" }],
    include: { category: { select: { name: true, slug: true } } },
  });

  const membersOnlyCount = user
    ? 0
    : await db.resource.count({
        where: { published: true, visibility: "MEMBERS" },
      });

  // Group by category for display.
  const groups = new Map<string, typeof resources>();
  for (const resource of resources) {
    const key = resource.category?.name ?? "General";
    const list = groups.get(key) ?? [];
    list.push(resource);
    groups.set(key, list);
  }

  return (
    <section className="bg-slate-50/50 py-16">
      <div className={PAGE}>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-3 text-lg text-slate-500">{t.lead}</p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-bdaio-blue-light" />
        </div>

        {membersOnlyCount > 0 && (
          <p className="mb-8 rounded-lg bg-white px-4 py-3 text-center text-sm text-slate-600 ring-1 ring-slate-200">
            {membersOnlyCount} more{" "}
            {membersOnlyCount === 1 ? "resource is" : "resources are"} available to
            BdAIO members.{" "}
            <Link href="/login" className="font-semibold text-bdaio-blue hover:underline">
              Sign in
            </Link>{" "}
            to see them.
          </p>
        )}

        {resources.length === 0 ? (
          <p className="text-center text-sm text-slate-500">{t.empty}</p>
        ) : (
          <div className="space-y-8">
            {[...groups.entries()].map(([category, items]) => (
              <div key={category}>
                <h2 className="text-lg font-bold text-slate-900">{category}</h2>
                <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                  {items.map((resource) => {
                    const href = resource.url ?? undefined;
                    return (
                      <li key={resource.id} className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {resource.title}
                              </p>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {KIND_LABELS[resource.kind]}
                              </span>
                              {resource.visibility === "MEMBERS" && (
                                <span className="rounded-full bg-bdaio-blue/10 px-2 py-0.5 text-xs font-semibold text-bdaio-blue">
                                  members
                                </span>
                              )}
                            </div>
                            {resource.titleBn && (
                              <p className="font-bengali text-sm text-slate-500">
                                {resource.titleBn}
                              </p>
                            )}
                            {resource.description && (
                              <p className="mt-1 text-sm text-slate-600">
                                {resource.description}
                              </p>
                            )}
                          </div>
                          {href && (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-lg bg-bdaio-blue px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
                            >
                              Open
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
