import type { Metadata } from "next";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/storage/uploads";
import { MediaUploadForm } from "@/components/admin/MediaUploadForm";
import { MediaCard } from "@/components/admin/MediaCard";

export const metadata: Metadata = { title: "Media · Admin" };

export default async function AdminMediaPage() {
  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sponsors: true } } },
  });

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Media</h1>
      <p className="mt-1 text-sm text-slate-600">
        Images uploaded once and reused wherever they are needed — sponsor logos today. Every
        upload is re-encoded to WebP, which is also what proves it is really an image.
      </p>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Upload an image</h2>
        <div className="mt-4">
          <MediaUploadForm />
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">
        Library ({assets.length})
      </h2>

      {assets.length === 0 ? (
        <p className="mt-3 rounded-xl bg-white p-5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          Nothing uploaded yet.
        </p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={{
                id: asset.id,
                url: mediaUrl(asset.filename),
                title: asset.title,
                alt: asset.alt,
                width: asset.width,
                height: asset.height,
                sizeBytes: asset.sizeBytes,
                usedBy: asset._count.sponsors,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
