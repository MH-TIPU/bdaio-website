import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/participation-guideline">,
): Promise<Metadata> {
  const locale = "en";
  return pageMetadata({
    locale,
    path: "/participation-guideline",
    title: "Participation Guideline"
  });
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-bold text-bdaio-blue hover:text-bdaio-blue-dark hover:underline"
    >
      {children}
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  );
}

export default function ParticipationGuidelinePage() {
  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl space-y-12 px-4 text-slate-700 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-black text-bdaio-blue sm:text-5xl">
            Participation Guidelines
          </h1>
          <p className="mt-4 text-lg text-slate-550 leading-relaxed">
            Participating in the BdAIO problem-solving and quiz competition is straightforward. Below is your step-by-step guide to get started.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-bdaio-blue-light" />
        </div>

        {/* 1. Registration Steps */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-bdaio-blue border-b border-slate-100 pb-3">Registration Steps</h2>
          <ul className="list-disc pl-5 space-y-3 text-sm text-slate-600 leading-relaxed">
            <li>First, visit the official BdAIO website (<ExternalLink href="https://www.bdaio.org">www.bdaio.org</ExternalLink>) and click on the Registration button located in the top-right header.</li>
            <li>Create an account or sign in to your existing account.</li>
            <li>Select &apos;Get a Ticket&apos; to register for the AI Olympiad segments.</li>
          </ul>

          <div className="bg-blue-50/30 border border-blue-100/60 rounded-xl p-5 space-y-4 text-sm text-slate-650 leading-relaxed">
            <p>
              Registration for the Quiz segment is free. For the AI Problem Solving (Kaggle competition) segment, a registration fee applies. Ensure you provide your Kaggle account ID during registration.
            </p>
            <p>
              Confirmation will be sent via email upon successful registration. Prepare for your regional rounds accordingly!
            </p>
          </div>
        </div>

        {/* 2. Kaggle Account Creation */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-bdaio-blue border-b border-slate-100 pb-3">Kaggle Setup &amp; Preparation</h2>
          <ul className="list-disc pl-5 space-y-3 text-sm text-slate-600 leading-relaxed">
            <li>The AI segment is hosted on Kaggle (<ExternalLink href="https://www.kaggle.com">www.kaggle.com</ExternalLink>). Create a Kaggle account if you do not already have one.</li>
            <li>Use your full name and official email address when signing up.</li>
            <li>
              Explore Kaggle tutorials and video guides: <ExternalLink href="https://www.youtube.com/watch?v=GJBOMWplpTQ&list=PLqFaTIg4myu8gdbDh6o8l7XRYNbltHpdEW">YouTube Playlist</ExternalLink>
            </li>
          </ul>
        </div>

        {/* 3. Kaggle Preparation & Courses */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-bdaio-blue border-b border-slate-100 pb-3">Machine Learning Courses &amp; Resources</h2>
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Recommended Kaggle Micro-courses:</h3>
            <ul className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
              <li>• <ExternalLink href="https://www.kaggle.com/learn/intro-to-machine-learning">Intro to Machine Learning</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/learn/intermediate-machine-learning">Intermediate Machine Learning</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/learn/feature-engineering">Feature Engineering</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/learn-guide/kaggle-competitions">Kaggle Competitions Guide</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/learn-guide/natural-language-processing">NLP Guide</ExternalLink></li>
            </ul>
          </div>
        </div>

        {/* 4. Important Regulations */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-bdaio-blue border-b border-slate-100 pb-3">Competition Rules</h2>
          <ul className="list-disc pl-5 space-y-2.5 text-sm text-slate-650 leading-relaxed">
            <li>Code submission is managed via Kaggle Notebooks during official competition windows.</li>
            <li>Use of AI Chatbots (ChatGPT, Claude, Gemini) during live contest rounds is strictly prohibited unless explicitly authorized.</li>
            <li>Printed documentation, books, and reference code snippets are permitted for offline consultation.</li>
          </ul>
        </div>

        {/* Bottom Navigation Link */}
        <div className="text-center pt-6">
          <Link href="/syllabus" className="inline-flex items-center gap-2 text-base font-bold text-bdaio-blue hover:text-bdaio-blue-dark hover:underline">
            View Syllabus
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
