import type { Metadata } from "next";
import { db } from "@/lib/db";
import { deleteFaq } from "@/server/cms/actions";
import { FaqRowForm } from "@/components/admin/FaqRowForm";
import { AddFaqModal } from "@/components/admin/FaqModals";
import { readPagination } from "@/lib/admin/pagination";
import { Pagination } from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "FAQ · Admin" };

export default async function AdminFaqPage(props: PageProps<"/admin/faq">) {
  const params = await props.searchParams;
  const { page, pageSize, skip, take } = readPagination(params, 10);

  const [totalFaq, items] = await Promise.all([
    db.faqItem.count(),
    db.faqItem.findMany({
      orderBy: [{ order: "asc" }],
      skip,
      take,
    }),
  ]);

  const defaultSection = items.at(-1)?.section ?? "General";
  const nextOrder = (items.at(-1)?.order ?? 0) + 1;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">FAQ</h1>
          <p className="mt-1 text-sm text-slate-600">
            Questions shown on the public FAQ page, in order.
          </p>
        </div>
        <AddFaqModal defaultSection={defaultSection} nextOrder={nextOrder} />
      </div>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <FaqRowForm
              defaults={{
                id: item.id,
                section: item.section,
                question: item.question,
                answer: item.answer,
                order: String(item.order),
                published: item.published,
              }}
            />
            <form action={deleteFaq} className="mt-3">
              <input type="hidden" name="id" value={item.id} />
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
        totalItems={totalFaq}
        basePath="/admin/faq"
        searchParams={params}
      />
    </>
  );
}
