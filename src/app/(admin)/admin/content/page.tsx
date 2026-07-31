import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Content · Admin" };

export default async function AdminContentPage() {
  const pages = await db.page.findMany({ orderBy: { title: "asc" } });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content pages</h1>
          <p className="mt-1 text-sm text-slate-600">
            Editable copy served at /p/[slug] — change wording without a deploy.
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className="rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-bdaio-blue-dark"
        >
          New page
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Page</th>
              <th className="px-4 py-3 font-semibold text-slate-700">State</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pages.map((page) => (
              <tr key={page.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{page.title}</p>
                  <p className="font-mono text-xs text-slate-500">/p/{page.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      page.published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {page.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {page.updatedAt.toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/content/${page.id}`}
                    className="text-sm font-semibold text-bdaio-blue hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No content pages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
