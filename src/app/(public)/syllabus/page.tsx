import type { Metadata } from "next";
import { Accordion } from "@/components/Accordion";
import { syllabusSections } from "@/data/syllabus";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { dictionaryFor, getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata(
  { params }: PageProps<"/syllabus">,
): Promise<Metadata> {
  const locale = "en";
  const meta = dictionaryFor(locale).pages.syllabus;
  return pageMetadata({
    locale,
    path: "/syllabus",
    title: meta.title,
  });
}

export default async function SyllabusPage({ params }: PageProps<"/syllabus">) {
  const locale = "en";
  
  const t = getDictionary(locale).pages.syllabus;

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            {t.lead}
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-bdaio-blue-light" />
        </div>

        {/* Syllabus Sections */}
        <div className="space-y-16">
          {syllabusSections.map((section) => (
            <div key={section.title} className="space-y-6">
              {section.title && (
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-slate-800 shrink-0">
                    {section.title}
                  </h2>
                  <div className="h-px bg-slate-200 w-full" />
                </div>
              )}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
                <Accordion items={section.items} />
              </div>
            </div>
          ))}
        </div>

        {/* Syllabus Note footer */}
        <div className="mt-16 rounded-2xl border border-blue-100 bg-blue-50/20 p-8 text-center max-w-2xl mx-auto">
          <h3 className="text-base font-bold text-bdaio-blue mb-2">{t.noteTitle}</h3>
          <p className="text-sm text-slate-550 leading-relaxed">{t.noteBody}</p>
        </div>
      </div>
    </section>
  );
}
