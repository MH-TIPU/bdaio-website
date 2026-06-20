
const steps = [
  {
    number: "01",
    title: "Register",
    description: "Sign up and register for Quiz or AI Problem Solving.",
    button: "How to Register",
    href: "/participation-guideline",
  },
  {
    number: "02",
    title: "Qualify",
    description: "Compete and pass the online/regional rounds from 2 – 10 May 2026.",
    button: "View Rules",
    href: "/rules",
  },
  {
    number: "03",
    title: "Compete",
    description: "Ace the national-level round in Dhaka on 16 May 2026.",
    button: "View Syllabus",
    href: "/syllabus",
  },
  {
    number: "04",
    title: "Selection",
    description: "Join the intensive 3-day Selection Camp & Grooming from 18 – 20 May 2026.",
    button: "Event Schedule",
    href: "/events",
  },
  {
    number: "05",
    title: "Represent",
    description: "Represent Bangladesh globally at IAIO Riyadh and IOAI China.",
    button: "Our Archives",
    href: "/archives",
  },
];

export function JourneySection() {
  return (
    <section className="bg-white py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-[#1e5a8a]">Olympiad Journey</h2>
          <p className="mt-2 text-slate-500">
            Follow the path from registration to representing Bangladesh on the global stage.
          </p>
        </div>

        {/* Journey Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 relative">
          {steps.map((step) => (
            <div
              key={step.title}
              className="relative flex flex-col rounded-2xl border border-slate-100 bg-slate-50/40 p-6 shadow-xs transition-all duration-300 hover:shadow-md hover:bg-slate-50/80 group"
            >
              <span className="text-3xl font-black text-blue-500/20 group-hover:text-blue-500/30 transition-colors block mb-4">
                {step.number}
              </span>
              <h3 className="text-lg font-bold text-[#1e5a8a] mb-2">{step.title}</h3>
              <p className="text-xs leading-relaxed text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>

        {/* WhatsApp Card */}
        <div className="mt-16 text-center">
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-100 bg-[#f0fdf4] p-8 shadow-xs">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Connect with the Community</h3>
            <p className="text-sm text-slate-500 mb-6">
              Join our active community of learners, mentors, and past winners on WhatsApp. Get help, resources, and instant updates!
            </p>
            <a
              href="https://chat.whatsapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600 hover:shadow-emerald-500/35"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.66.986 3.288 1.488 4.957 1.489 5.433 0 9.85-4.414 9.854-9.843.002-2.63-1.023-5.101-2.887-6.968C16.666 1.965 14.191.94 11.56.94c-5.438 0-9.854 4.416-9.858 9.845-.002 1.81.474 3.582 1.382 5.148L2.06 21.97l6.082-1.596z" />
              </svg>
              Join Our WhatsApp Community
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
