import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { dictionaryFor, getDictionary, isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "./ContactForm";
import { PAGE_NARROW } from "@/lib/layout";

export async function generateMetadata(
  { params }: PageProps<"/contact">,
): Promise<Metadata> {
  const locale = "en";
  const meta = dictionaryFor(locale).pages.contact;
  return pageMetadata({
    locale,
    path: "/contact",
    title: meta.title,
  });
}

export default async function ContactPage({ params }: PageProps<"/contact">) {
  const locale = "en";
  
  const t = getDictionary(locale).pages.contact;
  const settings = await getSettings();

  const address = settings["contact.address"];

  return (
    <section className="bg-white py-20">
      {/* Narrow on purpose: this page is a form, and a form stretched across a
          wide screen makes the eye travel from a label on one side to its field
          on the other. */}
      <div className={`${PAGE_NARROW} space-y-6 text-center`}>
        {/* Main Header - Matches the old site screenshot */}
        <h1 className="text-2xl font-bold tracking-tight text-bdaio-blue">
          {t.title}
        </h1>

        {/* Email Address - Matches the old site screenshot */}
        <p className="text-sm font-semibold text-slate-700">
          {t.emailLabel}:{" "}
          <a
            href={`mailto:${settings["contact.email"]}`}
            className="text-bdaio-blue hover:underline"
          >
            {settings["contact.email"]}
          </a>
        </p>

        {settings["contact.phone"] && (
          <p className="text-sm font-semibold text-slate-700">
            {t.phoneLabel}:{" "}
            <a
              href={`tel:${settings["contact.phone"].replace(/\s+/g, "")}`}
              className="text-bdaio-blue hover:underline"
            >
              {settings["contact.phone"]}
            </a>
          </p>
        )}

        {/* Office Details - Matches the old site screenshot */}
        {address && (
          <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-2xl mx-auto">
            {t.officeLabel}: {address}
          </p>
        )}

        <div className="mt-10 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-5 text-left text-lg font-bold text-slate-900">
            {t.formTitle}
          </h2>
          <ContactForm t={t} />
        </div>
      </div>
    </section>
  );
}
