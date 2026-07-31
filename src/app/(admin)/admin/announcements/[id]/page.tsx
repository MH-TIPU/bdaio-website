import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";

export const metadata: Metadata = { title: "Edit announcement · Admin" };

/** datetime-local needs `YYYY-MM-DDTHH:mm` in local time. */
function localInput(value: Date | null): string {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default async function EditAnnouncementPage(
  props: PageProps<"/admin/announcements/[id]">,
) {
  const { id } = await props.params;
  const a = await db.announcement.findUnique({ where: { id } });
  if (!a) notFound();

  return (
    <>
      <Link href="/admin/announcements" className="text-sm font-medium text-bdaio-blue hover:underline">
        ← Announcements
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">{a.title}</h1>
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <AnnouncementForm
          defaults={{
            id: a.id,
            title: a.title,
            titleBn: a.titleBn ?? "",
            body: a.body,
            bodyBn: a.bodyBn ?? "",
            audience: a.audience,
            pinned: a.pinned,
            published: a.published,
            publishAt: localInput(a.publishAt),
            expiresAt: localInput(a.expiresAt),
          }}
        />
      </div>
    </>
  );
}
