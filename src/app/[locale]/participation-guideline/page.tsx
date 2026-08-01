import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Participation Guideline",
};

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-bold text-[#1e5a8a] hover:text-blue-700 hover:underline"
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
      <div className="font-bengali mx-auto max-w-7xl space-y-12 px-4 text-slate-700 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-black text-[#1e5a8a] sm:text-5xl">
            নির্দেশিকা
          </h1>
          <p className="mt-4 text-lg text-slate-550 leading-relaxed">
            এআই অলিম্পিয়াডের AI প্রবলেম সলভিং ও কুইজ কম্পিটিশনে অংশ নেওয়ার ধাপগুলো খুবই সহজ। ধাপগুলো আমরা নিচে বর্ণনা করেছি।
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        {/* 1. Registration Steps */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-[#1e5a8a] border-b border-slate-100 pb-3">নিবন্ধন করার ধাপসমূহ</h2>
          <ul className="list-disc pl-5 space-y-3 text-sm text-slate-600 leading-relaxed">
            <li>সবার প্রথম কাজ হলো নিবন্ধন করা। এজন্য প্রথমে এআই অলিম্পিয়াডের ওয়েবসাইটে যাবে (<ExternalLink href="https://www.bdaio.org">www.bdaio.org</ExternalLink>)। সেখানে তুমি উপরের ডান কোণায় একটি রেজিস্ট্রেশন বাটন পাবে।</li>
            <li>রেজিস্ট্রেশন বাটনে ক্লিক করলে তোমাকে রেজিস্ট্রেশন পেজে নিয়ে যাবে।</li>
            <li>এখানে প্রথমে একাউন্ট খুলে নিতে হবে। তারপরে &apos;Get a Ticket&apos; অপশন থেকে রেজিস্ট্রেশন করতে হবে।</li>
          </ul>

          <div className="bg-blue-50/30 border border-blue-100/60 rounded-xl p-5 space-y-4 text-sm text-slate-650 leading-relaxed">
            <p>
              কুইজ প্রতিযোগিতায় রেজিস্ট্রেশন ফ্রি- মানে কোন টাকা দিতে হবে না। কিন্তু আর্টিফিশিয়াল ইন্টেলিজেন্স অংশে ক্যাগল কম্পিটিশন হবে। এটার রেজিস্ট্রেশন ফি ১০০ টাকা। রেজিস্ট্রেশনের সময় বিকাশের মাধ্যমে তোমাকে এই টাকা জমা দিতে হবে। পাশাপাশি তোমার ক্যাগল একাউন্ট আইডিও ফর্মে দিতে হবে। (ক্যাগল একাউন্ট তৈরি করার প্রক্রিয়া পরের সেকশনে দেখানো হয়েছে।)
            </p>
            <p>
              রেজিস্ট্রেশন প্ল্যাটফর্মে একাউন্ট ক্রিয়েট করার পর Get a Ticket থেকে QUIZ অথবা AI Problem Solving এর যে কোন একটি ক্যাটাগরিতে নিবন্ধন করা যাবে। নিবন্ধন হয়ে গেলে ইমেইলের মাধ্যমে নিবন্ধন নিশ্চিত করা হবে। এর পরবর্তীতে প্রতিযোগিদের আঞ্চলিক প্রতিযোগিতার জন্য প্রস্তুতি নিতে হবে।
            </p>
            <p className="font-bold text-[#1e5a8a]">
              নিবন্ধন করার ধাপগুলো এই ভিডিওতেও পাবে: <ExternalLink href="https://www.facebook.com/share/v/193oiRXbee/">ফেসবুক ভিডিও লিংক</ExternalLink>
            </p>
          </div>
        </div>

        {/* 2. Kaggle Account Creation */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-[#1e5a8a] border-b border-slate-100 pb-3">ক্যাগল একাউন্ট তৈরি:</h2>
          <ul className="list-disc pl-5 space-y-3 text-sm text-slate-600 leading-relaxed">
            <li>আর্টিফিশিয়াল ইন্টেলিজেন্স সেগমেন্ট ক্যাগল প্ল্যাটফর্মে আয়োজিত হবে। সেজন্য ক্যাগলে একাউন্ট করে নিতে হবে।</li>
            <li>প্রথমে <ExternalLink href="https://www.kaggle.com">https://www.kaggle.com</ExternalLink> ওয়েবসাইটে যেতে হবে।</li>
            <li>ক্যাগল রেজিস্ট্রেশন পেজে ইমেইল, পাসওয়ার্ড আর পুরো নাম দিয়ে একাউন্ট তৈরি করতে হবে। একজনের কেবলমাত্র একটিই একাউন্ট থাকতে পারবে।</li>
            <li>একাউন্ট তৈরি হয়ে গেলে ড্যাশবোর্ড দেখতে পাবে।</li>
            <li>
              ক্যাগল ব্যবহার করা শিখতে পারো এই ভিডিওগুলো দেখে: <ExternalLink href="https://www.youtube.com/watch?v=GJBOMWplpTQ&list=PLqFaTIg4myu8gdbDh6o8l7XRYNbltHpdEW">ইউটিউব প্লেলিস্ট</ExternalLink>
            </li>
          </ul>
        </div>

        {/* 3. Kaggle Preparation & Courses */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-[#1e5a8a] border-b border-slate-100 pb-3">ক্যাগল ও মেশিন লার্নিং প্রস্তুতি</h2>
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">ক্যাগলের নিজস্ব কিছু মেশিন লার্নিং শেখার কোর্স রয়েছে। তুমি সেখান থেকেই শেখা শুরু করতে পারো। আমরা এখানে এরকম কিছু কোর্সের লিংক দিয়ে দিচ্ছি:</h3>
            <ul className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
              <li>• <ExternalLink href="https://www.kaggle.com/learn/intro-to-machine-learning">বিগিনার মেশিন লার্নিং কোর্স</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/learn/intermediate-machine-learning">ইন্টারমিডিয়েট মেশিন লার্নিং</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/learn/feature-engineering">ফিচার ইঞ্জিনিয়ারিং</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/learn-guide/kaggle-competitions">ক্যাগল কম্পিটিশন গাইড</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/learn-guide/natural-language-processing">এনএলপি গাইড</ExternalLink></li>
            </ul>
          </div>

          <div className="h-px bg-slate-100 my-6" />

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">আগের বছরের বাছাই ও মূল প্রতিযোগিতায় নিচের সমস্যাগুলো এসেছিল:</h3>
            <ul className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
              <li>• <ExternalLink href="https://www.kaggle.com/t/97c33d3008d242f58f660a46a1e72a7a">GPS Blackout</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/t/129cdede7ebb42f391204447cfb17a03">Iris – Your Favourite Dataset</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/t/79426bf9f9f79426bf9f969697752fc662be">The &apos;Wrapped&apos; Conspiracy</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/t/2311661dc3314747a9362cbce316480d">Emissions Oracle</ExternalLink></li>
              <li>• <ExternalLink href="https://www.kaggle.com/t/6d256e8e366542ea83b484c60ea585ce">6, 7, ..., 8?</ExternalLink></li>
            </ul>
          </div>

          <div className="h-px bg-slate-100 my-6" />

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">আমরা মূল কন্টেস্টের আগে কিছু মক কন্টেস্ট অর্গানাইজ করছি। সামনে নতুন আরও কিছু মক কন্টেস্টের ঘোষণা দেওয়া হবে:</h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>• <ExternalLink href="https://www.kaggle.com/t/986da5c5bc294d3e9554eb4af706dd6e">প্রথম মক কন্টেস্টের লিংক</ExternalLink></li>
              <li>• <ExternalLink href="https://drive.google.com/file/d/1lHU9Agfa4Qu7rJE6Z6LknLmuCp5-96R/view?usp=sharing">একটি সহজ সলিউশন নোটবুক</ExternalLink></li>
            </ul>
            <p className="text-xs text-slate-500 italic bg-slate-50/50 p-3.5 rounded-lg border border-slate-150 mt-3">
              (নোটবুক চালানোর আগে কন্টেস্টের ডেটাসেটটি আপলোড করে নিতে হবে। ক্যাগল ও গুগল কোলাবে নোটবুক চালানো যাবে।)
            </p>
          </div>
        </div>

        {/* 4. LLM Chatbot Tips */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-[#1e5a8a] border-b border-slate-100 pb-3">চ্যাটবট বা LLM-কে ব্যবহারের নির্দেশিকা</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            ChatGPT, Gemini, Claude ইত্যাদি চ্যাটবটের সাহায্যে তুমি নিজেও কিন্তু নিজের জন্য লার্নিং রিসোর্স তৈরি করে নিতে পারো!
          </p>
          <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-5 space-y-4">
            <h4 className="font-bold text-[#1e5a8a] text-sm">তোমার জন্য একটা প্রম্পটের উদাহরণ:</h4>
            <div className="rounded-xl border border-slate-200/60 bg-white p-5 font-mono text-xs text-slate-600 italic select-all cursor-pointer hover:border-slate-300 transition-colors">
              &quot;I am a student of class 9. I know basic python programming but I have never worked with AI models. In the next month, there is an AI Olympiad for school and college students in Bangladesh. I really want to participate in the kaggle competition segment, but I am feeling a bit nervous. Can I really learn AI &amp; ML before the contest? Can you concisely guide me?&quot;
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              এভাবে নিজের দরকারমত যেকোনো প্রশ্ন এলএলএম চ্যাটবটকে জিজ্ঞেস করে জেনে নিতে পারো।
            </p>
          </div>
        </div>

        {/* 5. Video & Other Resources */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-[#1e5a8a] border-b border-slate-100 pb-3">ভিডিও ও অন্যান্য রিসোর্স (কুইজ ও কোডিং উভয় সেগমেন্টের জন্য সহায়ক)</h2>
          <ul className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-blue-500">▶</span>
              <ExternalLink href="https://youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi">3 Blue 1 Brown Deep Learning Playlist</ExternalLink>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">▶</span>
              <ExternalLink href="https://youtube.com/playlist?list=PLblh5JKOoLUIxGDQs4LFFD-4IVzf-MEI">Statquest Machine Learning Playlist</ExternalLink>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">▶</span>
              <ExternalLink href="https://youtube.com/playlist?list=PLVIY_7IJCMJeRfZ68eVFecu-UcN9BbwiX">The Key Equation Behind Probability</ExternalLink>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">▶</span>
              <ExternalLink href="https://mlcourse.ai">mlcourse.ai</ExternalLink>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">📖</span>
              <ExternalLink href="https://d2l.ai">d2l.ai (Deep Learning Book)</ExternalLink>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">▶</span>
              <ExternalLink href="https://youtube.com/playlist?list=PLAQIhRjkbxbuWI23v9c1hsA9GvCAUHrvKZ">Andrej Karpathy Neural Network Zero to Hero</ExternalLink>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">▶</span>
              <ExternalLink href="https://youtube.com/playlist?list=PAoe7mmmvp0">Recurrent Networks Explained From First Principles</ExternalLink>
            </li>
          </ul>
        </div>

        {/* 6. Important Regulations & Kaggle Rules */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-[#1e5a8a] border-b border-slate-100 pb-3">প্রতিযোগিতার অতি গুরুত্বপূর্ণ নিয়মাবলী</h2>
          <ul className="list-disc pl-5 space-y-2.5 text-sm text-slate-650 leading-relaxed">
            <li>প্রতিযোগিতার সময় কোড করতে হবে ক্যাগল প্ল্যাটফর্মে।</li>
            <li>কোন এলএলএম চ্যাটবট (ChatGPT, Claude, Gemini etc) কন্টেস্টের সময় ব্যবহার করা যাবে না। কন্টেস্টের সময় কোন ওয়েবসাইটের কথা আলাদা করে বলে না দিলে সেটা ব্যবহার করা যাবে না।</li>
            <li>যেকোন বই, ডকুমেন্টেশনের কাগজের কপি নিয়ে আসা যাবে। কাগজে বেসিক কিছু কোড লিখে নিয়ে আসতে পারো।</li>
          </ul>

          <div className="h-px bg-slate-100 my-6" />

          <h3 className="font-bold text-slate-800 text-sm">ক্যাগল প্ল্যাটফর্মে সাবমিট করার নির্দেশিকা:</h3>
          <ul className="list-disc pl-5 space-y-3.5 text-sm text-slate-650 leading-relaxed">
            <li>কন্টেস্টের লিংকে ঢুকে <strong>&quot;Join Competition&quot;</strong> বাটনে ক্লিক করো।</li>
            <li><strong>ডেটা সংগ্রহঃ</strong> কম্পিটিশন পেজের <strong>&quot;Data&quot;</strong> ট্যাব থেকে ফাইলগুলো দেখে নাও। এখানে দুটি মূল ফাইল পাবে:
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li><strong>Train:</strong> যা দিয়ে তুমি তোমার এআই মডেলকে শেখাবে।</li>
                <li><strong>Test:</strong> যার উত্তর তোমাকে বের করতে হবে।</li>
              </ul>
            </li>
            <li><strong>কোড লেখারঃ</strong> <strong>&quot;Notebooks&quot;</strong> ট্যাবে গিয়ে একটি নতুন নোটবুক খোলো। সেখানে তোমার কোড লিখে <strong>submission.csv</strong> নামে একটি আউটপুট ফাইল তৈরি করো।</li>
          </ul>

          <div className="bg-amber-50/40 border border-amber-100/60 rounded-xl p-5 space-y-4 text-sm text-slate-650 leading-relaxed">
            <p>
              নিশ্চিত করো যে তোমার তৈরি করা <strong>submission.csv</strong> ফাইলের কলামগুলোর নাম হুবহু কম্পিটিশন পেজের স্যাম্পল ফাইলের মতো হয়। স্পেলিং ভুল হলে স্কোর আসবে না।
            </p>
            <p>
              <strong>সাবমিট করা ও লিডারবোর্ডঃ</strong> নোটবুকের ডান পাশে উপরে থাকা <strong>&quot;Save Version&quot;</strong> বাটনে ক্লিক করে <strong>&quot;Save &amp; Run All&quot;</strong> দাও। লোড হয়ে গেলে <strong>&quot;Output&quot;</strong> সেকশন থেকে সিএসভি (CSV) ফাইলটি সাবমিট করো। সাথে সাথেই লিডারবোর্ডে তোমার স্কোর দেখতে পাবে।
            </p>
            <p>
              মনে রেখো, লিডারবোর্ডের স্কোরটি প্রাথমিক। প্রতিযোগিতার শেষে প্রাইভেট ডেটাসেটের সাথে মিলিয়ে চূড়ান্ত রেজাল্ট ঘোষণা করা হবে।
            </p>
            <p>
              একদম শেষ মিনিটের জন্য সাবমিশন জমিয়ে রেখো না। অন্তত ১০-২০ মিনিট হাতে থাকতেই সাবমিশন করার চেষ্টা করো, কারণ বড় মডেলে <strong>Save &amp; Run All</strong> হতে কিছুটা সময় লাগে।
            </p>
            <p>
              <strong>নোটবুক সাবমিশনঃ</strong> প্রতিযোগিতা শেষ হওয়ার আগে তোমার নোটবুকটি <strong>&apos;Private&apos;</strong> রাখবে (যাতে অন্য কেউ কোড দেখতে না পারে)। আমাদের দেওয়া নির্দিষ্ট অ্যাকাউন্টের সাথে নোটবুকটি শেয়ার করতে হবে। নোটবুকের টাইটেলে তোমার নাম, প্রবলেমের নাম ও এলাকার নাম লিখে দেবে যাতে আমরা সহজে খুঁজে পাই। প্রতিযোগিতা শেষ হওয়ার আগে শেয়ারিং সফল হয়েছে কি না নিশ্চিত করে নেবে।
            </p>
          </div>
        </div>

        {/* Bottom Navigation Link */}
        <div className="text-center pt-6">
          <Link href="/syllabus" className="inline-flex items-center gap-2 text-base font-bold text-[#1e5a8a] hover:text-blue-700 hover:underline">
            সিলেবাস দেখুন
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
