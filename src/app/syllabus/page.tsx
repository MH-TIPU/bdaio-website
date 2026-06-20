import type { Metadata } from "next";
import { Accordion } from "@/components/Accordion";
import { syllabusSections } from "@/data/syllabus";

export const metadata: Metadata = {
  title: "Syllabus",
};

export default function SyllabusPage() {
  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-[#1e5a8a] sm:text-5xl">
            Competition Syllabus
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Comprehensive topics and areas covered in BdAIO and international rounds.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
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
          <h3 className="text-base font-bold text-[#1e5a8a] mb-2">Preparing for the International Olympiad?</h3>
          <p className="text-sm text-slate-550 leading-relaxed">
            The national contest syllabus is aligned with the International Olympiad on Artificial Intelligence (IOAI) and International AI Olympiad (IAIO) benchmarks. Make sure to review previous years&apos; Kaggle competition datasets.
          </p>
        </div>
      </div>
    </section>
  );
}
