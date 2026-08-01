import type { Dictionary } from "./en";

/**
 * বাংলা. Typed as `Dictionary`, so a key added to English fails the build until
 * it is translated here — the mechanism that stops Bengali drifting behind.
 *
 * Register matches the Bengali already in the repo (the FAQ rows and the
 * participation guideline): direct, second-person plural (আপনি), and the
 * platform's own name left as "BdAIO" rather than transliterated, because that
 * is how the team writes it everywhere else.
 */
export const bn: Dictionary = {
  nav: {
    home: "হোম",
    about: "পরিচিতি",
    compete: "প্রতিযোগিতা",
    programs: "প্রোগ্রাম",
    events: "ইভেন্ট",
    workshops: "কর্মশালা ও কোর্স",
    community: "কমিউনিটি",
    institutions: "প্রতিষ্ঠান ও ক্লাব",
    registerInstitution: "আপনার প্রতিষ্ঠান নিবন্ধন করুন",
    results: "ফলাফল",
    announcements: "ঘোষণা",
    news: "সংবাদ",
    resources: "রিসোর্স",
    resourceLibrary: "রিসোর্স লাইব্রেরি",
    syllabus: "সিলেবাস",
    participationGuideline: "অংশগ্রহণ নির্দেশিকা",
    faq: "সাধারণ জিজ্ঞাসা",
    contact: "যোগাযোগ",
    openMenu: "মেনু খুলুন",
    closeMenu: "মেনু বন্ধ করুন",
  },

  common: {
    dashboard: "ড্যাশবোর্ড",
    profile: "প্রোফাইল",
    signIn: "সাইন ইন",
    signOut: "সাইন আউট",
    signUp: "অ্যাকাউন্ট তৈরি করুন",
    save: "সংরক্ষণ করুন",
    saving: "সংরক্ষণ হচ্ছে…",
    cancel: "বাতিল",
    back: "ফিরে যান",
    loading: "লোড হচ্ছে…",
    search: "খুঁজুন",
    tryAgain: "আবার চেষ্টা করুন",
    readMore: "বিস্তারিত",
    nothingYet: "এখানে এখনো কিছু নেই।",
  },

  language: {
    label: "ভাষা",
    switchTo: "ভাষা বদলে করুন",
  },

  auth: {
    signInTitle: "সাইন ইন",
    signInSubtitle: "BdAIO-তে আবার স্বাগতম।",
    registerTitle: "আপনার অ্যাকাউন্ট তৈরি করুন",
    email: "ইমেইল",
    password: "পাসওয়ার্ড",
    confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
    fullName: "পুরো নাম",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    newHere: "BdAIO-তে নতুন?",
    haveAccount: "আগেই অ্যাকাউন্ট আছে?",
    invalidCredentials: "ইমেইল বা পাসওয়ার্ড সঠিক নয়।",
  },

  pages: {
    events: {
      title: "ইভেন্ট",
      lead: "BdAIO-র সব প্রোগ্রামের অলিম্পিয়াড রাউন্ড, কর্মশালা, সেমিনার ও কোর্স।",
      empty: "এই মুহূর্তে কোনো ইভেন্ট নির্ধারিত নেই। শীঘ্রই আবার দেখুন।",
      past: "পূর্ববর্তী ইভেন্ট",
    },
    programs: {
      title: "প্রোগ্রাম",
      lead: "আমাদের পরিচালিত সব প্রতিযোগিতা ও কর্মশালা, এবং যেসব আন্তর্জাতিক অলিম্পিয়াডে আমরা বাংলাদেশি শিক্ষার্থীদের মনোনয়ন দিই।",
      empty: "এখনো কোনো প্রোগ্রাম প্রকাশ করা হয়নি।",
    },
    workshops: {
      title: "কর্মশালা ও কোর্স",
      lead: "অলিম্পিয়াডের জন্য প্রয়োজনীয় দক্ষতা গড়ে তোলার হাতে-কলমে সেশন — BdAIO অ্যাকাউন্ট থাকলেই অংশ নেওয়া যাবে।",
      empty: "এই মুহূর্তে কোনো কর্মশালা চালু নেই। শীঘ্রই আবার দেখুন।",
    },
    resources: {
      title: "রিসোর্স",
      lead: "সিলেবাস, নির্দেশিকা, আগের প্রশ্ন এবং শেখার উপকরণ।",
      empty: "এখনো কোনো রিসোর্স প্রকাশ করা হয়নি।",
    },
    results: {
      title: "ফলাফল",
      lead: "প্রকাশিত অবস্থান ও পদকজয়ীদের তালিকা।",
      empty: "এখনো কোনো ফলাফল প্রকাশ করা হয়নি।",
    },
    institutions: {
      title: "প্রতিষ্ঠান ও ক্লাব",
      lead: "BdAIO-তে অংশ নেওয়া স্কুল, কলেজ, বিশ্ববিদ্যালয় ও এআই ক্লাব।",
      empty: "আপনার অনুসন্ধানের সঙ্গে মেলে এমন কোনো প্রতিষ্ঠান পাওয়া যায়নি।",
    },
    announcements: {
      title: "ঘোষণা",
      lead: "BdAIO আয়োজক দলের পক্ষ থেকে বিজ্ঞপ্তি।",
      empty: "এই মুহূর্তে কোনো ঘোষণা নেই।",
    },
  },

  offline: {
    title: "আপনি অফলাইনে আছেন",
    body: "ইন্টারনেট সংযোগ না থাকায় BdAIO-তে পৌঁছানো যায়নি। সংযোগ ফিরে এলে আবার চেষ্টা করুন।",
  },

  footer: {
    copyright: "বাংলাদেশ আর্টিফিশিয়াল ইন্টেলিজেন্স অলিম্পিয়াড",
    followUs: "আমাদের অনুসরণ করুন",
  },
};
