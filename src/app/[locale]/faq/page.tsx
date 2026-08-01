import type { Metadata } from "next";
import { Accordion } from "@/components/Accordion";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/faq">,
): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/faq",
    title: "FAQ"
  });
}

// Editable in the admin panel, so this must not freeze at build time.
export const revalidate = 60;

export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).pages.faq;

  const items = await db.faqItem.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });

  // Group into the sections the questions were filed under, preserving order.
  const sections: { title: string; items: { question: string; answer: string }[] }[] = [];
  for (const item of items) {
    let section = sections.find((s) => s.title === item.section);
    if (!section) {
      section = { title: item.section, items: [] };
      sections.push(section);
    }
    section.items.push({ question: item.question, answer: item.answer });
  }

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Title - Matches the old site screenshot */}
        <h1
          className={`text-center text-3xl font-bold text-[#1e5a8a] mb-12 ${
            locale === "bn" ? "font-bengali" : ""
          }`}
        >
          {t.title}
        </h1>

        {sections.length === 0 ? (
          <p className="text-center text-sm text-slate-500">{t.empty}</p>
        ) : (
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h2 className="font-bengali text-center text-xl font-semibold text-[#1e5a8a] mt-4">
                  {section.title}
                </h2>
                <div className="pt-2">
                  <Accordion items={section.items} bengali />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
