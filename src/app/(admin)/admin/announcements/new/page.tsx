import type { Metadata } from "next";
import Link from "next/link";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";

export const metadata: Metadata = { title: "New announcement · Admin" };

export default function NewAnnouncementPage() {
  return (
    <>
      <Link href="/admin/announcements" className="text-sm font-medium text-bdaio-blue hover:underline">
        ← Announcements
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">New announcement</h1>
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <AnnouncementForm
          defaults={{
            title: "",
            titleBn: "",
            body: "",
            bodyBn: "",
            audience: "EVERYONE",
            pinned: false,
            published: true,
            publishAt: "",
            expiresAt: "",
          }}
        />
      </div>
    </>
  );
}
