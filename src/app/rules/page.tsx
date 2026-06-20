import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Competition Rules",
};

export default function RulesPage() {
  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-[#1e5a8a] sm:text-5xl">
            Competition Rules
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Rules, eligibility criteria, and segment guidelines for BdAIO 2026.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        {/* 2x2 Grid of Rules */}
        <div className="grid gap-8 md:grid-cols-2 mb-16">
          {/* Card 1 - Eligibility */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 20M12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0-3.5a.75.75 0 110 1.5.75.75 0 010-1.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9a3 3 0 11-6 0 3 3 0 016 0zM6 9a3 3 0 11-6 0 3 3 0 016 0zm3 10.5a9 9 0 1118 0" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Eligibility</h2>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Students up to <strong>Grade 12 or equivalent</strong> may participate.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Polytechnic students up to the <strong>4th semester</strong> are eligible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>University students are <strong>not eligible</strong> for this competition.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Participants can register for Quiz, AI Problem Solving, or both segments.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2 - Phases */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Competition Phases</h2>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">1.</span>
                  <span><strong>Regional Round:</strong> Online and regional rounds held in May 2026.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">2.</span>
                  <span><strong>National Round:</strong> Top qualifiers compete at the national final round.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">3.</span>
                  <span><strong>Selection Camp:</strong> Top performers participate in grooming sessions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">4.</span>
                  <span><strong>International Gateway:</strong> Best camp students selected for IAIO / IOAI.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 3 - AI Segment */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">AI Segment Rules</h2>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>All programming and modeling must be done on the <strong>Kaggle platform</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Usage of LLM assistants (ChatGPT, Gemini, Claude, etc.) is <strong>strictly prohibited</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Notebooks must remain private and shared with organizers upon request.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Submission files must exactly match the required template CSV format.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 4 - Quiz Segment */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Quiz Segment Rules</h2>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  <span>Quiz registration is completely <strong>free of charge</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  <span>Questions are formulated in both <strong>Bengali and English</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  <span>Participants compete <strong>individually</strong>; team setups are not allowed.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Guideline Redirect */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-8 text-center max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-[#1e5a8a] mb-2">Ready to participate?</h3>
          <p className="text-sm text-slate-500 mb-5">
            Read our step-by-step registration instructions, learning playlists, and Kaggle guidelines.
          </p>
          <Link
            href="/participation-guideline"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1e5a8a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3d6b]"
          >
            Read Participation Guideline
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
