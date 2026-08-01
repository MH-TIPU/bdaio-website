import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <section className="py-24 bg-white flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 space-y-6">
        {/* Main Header - Matches the old site screenshot */}
        <h1 className="text-2xl font-bold tracking-tight text-[#1e5a8a]">
          Get In Touch
        </h1>

        {/* Email Address - Matches the old site screenshot */}
        <p className="text-sm font-semibold text-slate-700">
          E-Mail:{" "}
          <a
            href="mailto:bdaio@bdosn.org"
            className="text-[#1e5a8a] hover:underline"
          >
            bdaio@bdosn.org
          </a>
        </p>

        {/* Office Details - Matches the old site screenshot */}
        <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Office: Green City Center, Level 12, 758 Satmasjid Road, Dhaka 1209, Bangladesh
        </p>
      </div>
    </section>
  );
}
