import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
};

const events = [
  {
    title: "Dhaka Regional Round",
    date: "Saturday, 2 May 2026",
    venue: "Bangladesh University of Business & Technology (BUBT)",
    description: "In-person regional coding contest and paper-based AI quizzes for Dhaka division participants.",
    status: "Upcoming",
  },
  {
    title: "Regional / Online Round",
    date: "2 – 10 May 2026",
    venue: "Online (Kaggle Platform)",
    description: "Nationwide preliminary selection online contest. Open to all registered students outside Dhaka division.",
    status: "Upcoming",
  },
  {
    title: "National Round",
    date: "Saturday, 16 May 2026",
    venue: "Dhaka, Bangladesh",
    description: "The grand national finals. The top 50 qualifiers from the regional rounds compete for medals and Selection Camp slots.",
    status: "Upcoming",
  },
  {
    title: "Selection Camp & Grooming",
    date: "18 – 20 May 2026",
    venue: "Residential Camp, Dhaka",
    description: "Intensive training camp for the top 15 national winners led by industry experts and university professors to pick the national team.",
    status: "Upcoming",
  },
];

export default function EventsPage() {
  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-[#1e5a8a] sm:text-5xl">
            Events Schedule
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Follow the timeline of the BdAIO 2026 competition rounds.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        {/* Timeline Layout */}
        <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-12">
          {events.map((event, idx) => (
            <div key={idx} className="relative pl-8 md:pl-10 group">
              {/* Timeline Bullet */}
              <span className="absolute -left-[11px] top-1.5 flex h-5.5 w-5.5 items-center justify-center rounded-full border-4 border-slate-50 bg-blue-500 group-hover:bg-blue-600 transition-colors" />

              {/* Event Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h2>
                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                    {event.status}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1e5a8a]">
                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-400 font-semibold">
                    <svg className="h-4 w-4 shrink-0 text-slate-350" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{event.venue}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-550 pt-2 border-t border-slate-50">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
