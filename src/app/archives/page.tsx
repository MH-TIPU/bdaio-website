import type { Metadata } from "next";
import Image from "next/image";
import { galleryMedia } from "@/data/media";

export const metadata: Metadata = {
  title: "Archives",
};

const pastEvents = [
  {
    year: "2025",
    location: "Beijing, China",
    olympiad: "International Olympiad on Artificial Intelligence (IOAI)",
    achievements: [
      { type: "bronze", text: "2 Bronze Medals (awarded to top performers)" },
      { type: "mention", text: "2 Honorable Mentions (recognizing outstanding scientific paper results)" },
    ],
    highlights: "Introduced the national AI Quiz competition to make AI education accessible to school students at all preparation levels.",
  },
  {
    year: "2024",
    location: "Riyadh, Saudi Arabia",
    olympiad: "International Artificial Intelligence Olympiad (IAIO)",
    achievements: [
      { type: "silver", text: "2 Silver Medals - Misbah Uddin Inan & Arefin Anwar" },
      { type: "bronze", text: "2 Bronze Medals - Abrar Shahid & Rafid Ahmed" },
    ],
    highlights: "Inaugural participation of Bangladesh on the global AI stage, securing four medals out of four contestants.",
  },
];

export default function ArchivesPage() {
  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-[#1e5a8a] sm:text-5xl">
            Archives
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            A history of Bangladesh&apos;s journey and achievements at international AI Olympiads.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        {/* Timeline Cards */}
        <div className="space-y-12 mb-20">
          {pastEvents.map((event) => (
            <div
              key={event.year}
              className="rounded-2xl border border-slate-150 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                <div>
                  <span className="text-sm font-extrabold uppercase tracking-widest text-blue-500">
                    Olympiad Archive
                  </span>
                  <h2 className="text-2xl font-black text-slate-800">
                    BdAIO {event.year}
                  </h2>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold text-[#1e5a8a]">{event.olympiad}</p>
                  <p className="text-xs text-slate-400 font-semibold">{event.location}</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Team Achievements
                  </h3>
                  <ul className="space-y-2.5">
                    {event.achievements.map((ach, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-base shadow-xs">
                          {ach.type === "silver" ? "🥈" : ach.type === "bronze" ? "🥉" : "🎖️"}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">{ach.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Highlights
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {event.highlights}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gallery Section */}
        <div>
          <h2 className="text-2xl font-black text-[#1e5a8a] text-center mb-10">Activities Gallery</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryMedia.map((img, idx) => (
              <div
                key={idx}
                className="group relative h-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-xs font-bold text-white leading-snug">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
