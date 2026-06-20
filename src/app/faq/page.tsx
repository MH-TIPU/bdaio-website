import type { Metadata } from "next";
import { Accordion } from "@/components/Accordion";
import { faqSections } from "@/data/faq";

export const metadata: Metadata = {
  title: "FAQ",
};

export default function FaqPage() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Title - Matches the old site screenshot */}
        <h1 className="font-bengali text-center text-3xl font-bold text-[#1e5a8a] mb-12">
          প্রশ্নাবলী
        </h1>

        {/* Stacked FAQ Sections on flat white background */}
        <div className="space-y-10">
          {faqSections.map((section) => (
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
      </div>
    </section>
  );
}
