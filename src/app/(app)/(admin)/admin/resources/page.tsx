import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { deleteCategory, deleteResource } from "@/server/admin/resources";

export const metadata: Metadata = { title: "Resources · Admin" };

export default async function AdminResourcesPage() {
  const [resources, categories] = await Promise.all([
    db.resource.findMany({
      orderBy: [{ category: { order: "asc" } }, { title: "asc" }],
      include: { category: { select: { id: true, name: true } } },
    }),
    db.resourceCategory.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { resources: true } } },
    }),
  ]);

  const options = categories.map((category) => ({ id: category.id, name: category.name }));

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
      <p className="mt-1 text-sm text-slate-600">
        The public resource library. Members-only rows are filtered out of the query for
        signed-out visitors, so an unpublished or restricted title never reaches the page.
      </p>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">
        Resources <span className="font-normal text-slate-400">({resources.length})</span>
      </h2>

      <div className="mt-3 space-y-3">
        {resources.map((resource) => (
          <div key={resource.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <ResourceForm
              categories={options}
              defaults={{
                id: resource.id,
                title: resource.title,
                titleBn: resource.titleBn ?? "",
                description: resource.description ?? "",
                kind: resource.kind,
                visibility: resource.visibility,
                url: resource.url ?? "",
                categoryId: resource.categoryId ?? "",
                published: resource.published,
              }}
            />
            <form action={deleteResource} className="mt-3 border-t border-slate-100 pt-3">
              <input type="hidden" name="id" value={resource.id} />
              <button
                type="submit"
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
              >
                Delete
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Add a resource</h2>
        <div className="mt-4">
          <ResourceForm
            categories={options}
            defaults={{
              title: "",
              titleBn: "",
              description: "",
              kind: "MATERIAL",
              visibility: "PUBLIC",
              url: "",
              categoryId: options[0]?.id ?? "",
              published: true,
            }}
          />
        </div>
      </div>

      <h2 className="mt-10 text-sm font-semibold text-slate-900">Categories</h2>
      <p className="mt-1 text-xs text-slate-500">
        Headings on the public page, in order. Deleting one keeps its resources — they move to
        the General group rather than vanishing with the heading.
      </p>

      <div className="mt-3 space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <CategoryForm
              defaults={{
                id: category.id,
                name: category.name,
                slug: category.slug,
                order: String(category.order),
              }}
            />
            <form action={deleteCategory} className="mt-3 border-t border-slate-100 pt-3">
              <input type="hidden" name="id" value={category.id} />
              <button
                type="submit"
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
              >
                Delete ({category._count.resources} resource
                {category._count.resources === 1 ? "" : "s"} kept)
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Add a category</h2>
        <div className="mt-4">
          <CategoryForm
            defaults={{
              name: "",
              slug: "",
              order: String((categories.at(-1)?.order ?? 0) + 1),
            }}
          />
        </div>
      </div>
    </>
  );
}
