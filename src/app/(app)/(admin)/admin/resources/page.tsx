import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { AddResourceModal } from "@/components/admin/ResourceModals";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { deleteCategory, deleteResource } from "@/server/admin/resources";

import { readPagination } from "@/lib/admin/pagination";
import { Pagination } from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "Resources · Admin" };

export default async function AdminResourcesPage(props: PageProps<"/admin/resources">) {
  const params = await props.searchParams;
  const { page, pageSize, skip, take } = readPagination(params, 10);

  const [totalResources, resources, categories] = await Promise.all([
    db.resource.count(),
    db.resource.findMany({
      orderBy: [{ category: { order: "asc" } }, { title: "asc" }],
      skip,
      take,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
          <p className="mt-1 text-sm text-slate-600">
            The public resource library.
          </p>
        </div>
        <AddResourceModal categories={options} />
      </div>

      <div className="mt-6 space-y-3">
        {resources.map((resource) => (
          <div key={resource.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <ResourceForm
              categories={options}
              defaults={{
                id: resource.id,
                title: resource.title,
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

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalResources}
        basePath="/admin/resources"
        searchParams={params}
      />

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
