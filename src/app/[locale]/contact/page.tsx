import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { dictionaryFor, getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/contact">,
): Promise<Metadata> {
  const { locale } = await params;
  const meta = dictionaryFor(locale).pages.contact;
  return pageMetadata({
    locale,
    path: "/contact",
    title: meta.title,
  });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).pages.contact;

  return (
    <section className="py-24 bg-white flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 space-y-6">
        {/* Main Header - Matches the old site screenshot */}
        <h1 className="text-2xl font-bold tracking-tight text-[#1e5a8a]">
          {t.title}
        </h1>

        {/* Email Address - Matches the old site screenshot */}
        <p className="text-sm font-semibold text-slate-700">
          {t.emailLabel}:{" "}
          <a
            href="mailto:bdaio@bdosn.org"
            className="text-[#1e5a8a] hover:underline"
          >
            bdaio@bdosn.org
          </a>
        </p>

        {/* Office Details - Matches the old site screenshot */}
        <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-2xl mx-auto">
          {t.officeLabel}: {t.office}
        </p>
      </div>
    </section>
  );
}
