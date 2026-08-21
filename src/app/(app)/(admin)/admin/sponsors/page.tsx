import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/storage/uploads";
import { SPONSOR_TIERS, TIER_LABELS } from "@/lib/sponsors";
import { SponsorForm } from "@/components/admin/SponsorForm";
import { AddSponsorModal } from "@/components/admin/SponsorModals";
import { deleteSponsor } from "@/server/admin/sponsors";

import { readPagination } from "@/lib/admin/pagination";
import { Pagination } from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "Sponsors · Admin" };

export default async function AdminSponsorsPage(props: PageProps<"/admin/sponsors">) {
  const params = await props.searchParams;
  const { page, pageSize, skip, take } = readPagination(params, 15);

  const [totalSponsors, sponsors, assets] = await Promise.all([
    db.sponsor.count(),
    db.sponsor.findMany({
      orderBy: [{ tier: "asc" }, { order: "asc" }, { name: "asc" }],
      skip,
      take,
    }),
    db.mediaAsset.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, filename: true } }),
  ]);

  const options = assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    url: mediaUrl(asset.filename),
  }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sponsors</h1>
          <p className="mt-1 text-sm text-slate-600">
            The logo sections on the home page. Reusable images from{" "}
            <Link href="/admin/media" className="font-medium text-bdaio-blue hover:underline">
              Media
            </Link>
            .
          </p>
        </div>
        <AddSponsorModal assets={options} />
      </div>

      {options.length === 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          No images in the library yet — upload the logos first, or sponsors will render as a name plate.
        </p>
      )}

      {SPONSOR_TIERS.map((tier) => {
        const rows = sponsors.filter((sponsor) => sponsor.tier === tier);
        if (rows.length === 0) return null;
        return (
          <section key={tier} className="mt-8">
            <h2 className="text-sm font-semibold text-slate-900">
              {TIER_LABELS[tier]}{" "}
              <span className="font-normal text-slate-400">({rows.length})</span>
            </h2>
            <div className="mt-3 space-y-3">
              {rows.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
                >
                  <SponsorForm
                    assets={options}
                    defaults={{
                      id: sponsor.id,
                      name: sponsor.name,
                      tier: sponsor.tier,
                      url: sponsor.url ?? "",
                      assetId: sponsor.assetId ?? "",
                      order: String(sponsor.order),
                      published: sponsor.published,
                    }}
                  />
                  <form action={deleteSponsor} className="mt-3 border-t border-slate-100 pt-3">
                    <input type="hidden" name="id" value={sponsor.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                    >
                      Remove placement
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalSponsors}
        basePath="/admin/sponsors"
        searchParams={params}
      />
    </>
  );
}
