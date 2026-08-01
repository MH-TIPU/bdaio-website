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

  offline: {
    title: "আপনি অফলাইনে আছেন",
    body: "ইন্টারনেট সংযোগ না থাকায় BdAIO-তে পৌঁছানো যায়নি। সংযোগ ফিরে এলে আবার চেষ্টা করুন।",
  },

  footer: {
    copyright: "বাংলাদেশ আর্টিফিশিয়াল ইন্টেলিজেন্স অলিম্পিয়াড",
    followUs: "আমাদের অনুসরণ করুন",
  },
};
