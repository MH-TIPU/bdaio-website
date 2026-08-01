/**
 * The English dictionary — and, by being the source of the `Dictionary` type, the
 * contract every other locale must satisfy. Add a key here and TypeScript will
 * fail the build until `bn.ts` has it too, which is how we keep Bengali from
 * silently drifting behind (§11: "Bengali parity").
 *
 * Scope of this file: the site chrome, shared UI, and auth — the strings that
 * appear on every page. Page *prose* (about, rules, syllabus, guidelines) is
 * content, not UI, and is tracked separately in §13.2.
 */
export const en = {
  nav: {
    home: "Home",
    about: "About",
    compete: "Compete",
    programs: "Programs",
    events: "Events",
    workshops: "Workshops & Courses",
    community: "Community",
    institutions: "Institutions & Clubs",
    registerInstitution: "Register your institution",
    results: "Results",
    announcements: "Announcements",
    news: "News",
    resources: "Resources",
    resourceLibrary: "Resource library",
    syllabus: "Syllabus",
    participationGuideline: "Participation Guideline",
    faq: "FAQ",
    contact: "Contact Us",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  common: {
    dashboard: "Dashboard",
    profile: "Profile",
    signIn: "Sign in",
    signOut: "Sign out",
    signUp: "Create an account",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    back: "Back",
    loading: "Loading…",
    search: "Search",
    tryAgain: "Try again",
    readMore: "Read more",
    // Used wherever a list has nothing in it yet.
    nothingYet: "Nothing here yet.",
  },

  language: {
    /** Label for the switcher itself, e.g. as an aria-label. */
    label: "Language",
    /** aria-label on each option: "Switch to বাংলা". */
    switchTo: "Switch to",
  },

  auth: {
    signInTitle: "Sign in",
    signInSubtitle: "Welcome back to BdAIO.",
    registerTitle: "Create your account",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    fullName: "Full name",
    forgotPassword: "Forgot your password?",
    newHere: "New to BdAIO?",
    haveAccount: "Already have an account?",
    // Kept identical for an unknown email and a wrong password — §3.5.
    invalidCredentials: "Incorrect email or password.",
  },

  /**
   * Page headings, leads, and empty states for the public list pages.
   *
   * Only the framing copy lives here — the rows themselves come from the
   * database, where an event or a resource carries its own `*Bn` field.
   */
  pages: {
    events: {
      title: "Events",
      lead: "Olympiad rounds, workshops, seminars, and courses across every BdAIO program.",
      empty: "No events are scheduled right now. Please check back soon.",
      past: "Past events",
    },
    programs: {
      title: "Programs",
      lead: "Every competition and workshop series we run, plus the international olympiads we nominate Bangladeshi students to.",
      empty: "No programs are published yet.",
    },
    workshops: {
      title: "Workshops & Courses",
      lead: "Hands-on sessions to build the skills the olympiad asks for — open to everyone with a BdAIO account.",
      empty: "No workshops are open right now. Please check back soon.",
    },
    resources: {
      title: "Resources",
      lead: "Syllabuses, guidelines, past problems, and learning materials.",
      empty: "No resources have been published yet.",
    },
    results: {
      title: "Results",
      lead: "Published standings and medallists.",
      empty: "No results have been published yet.",
    },
    institutions: {
      title: "Institutions & Clubs",
      lead: "Schools, colleges, universities, and AI clubs taking part in BdAIO.",
      empty: "No institutions match your search.",
    },
    announcements: {
      title: "Announcements",
      lead: "Notices from the BdAIO organising team.",
      empty: "There are no announcements right now.",
    },

    /**
     * `about` is stored as an array of paragraphs rather than one blob: a
     * translator works paragraph by paragraph, and a mismatched count is then
     * visible instead of silently truncating the page.
     */
    about: {
      title: "About BdAIO",
      paragraphs: [
        "The Bangladesh Artificial Intelligence Olympiad (BdAIO) is a national-level competition designed to inspire, educate, and engage young minds in the rapidly evolving field of Artificial Intelligence. It provides a platform for students across Bangladesh to explore AI, develop problem-solving skills, and prepare for participation in international AI Olympiads. Through BdAIO, talented students are identified and trained to represent Bangladesh on the global stage.",
        "The Olympiad is open to students studying up to Grade 12 or equivalent levels, including students up to the 4th semester of Polytechnic institutes across Bangladesh. Participants demonstrate their programming proficiency in Python along with their understanding of core AI concepts such as machine learning, neural networks, natural language processing, and computer vision.",
        "BdAIO is conducted in multiple phases, beginning with a preliminary selection round and culminating in the national round. At each stage, participants refine their analytical thinking, strengthen their conceptual knowledge, and gain practical exposure to AI-related problem solving. The top-performing students are selected for advanced training and international representation.",
        "Bangladesh has already achieved notable success in global AI competitions. At the first International Artificial Intelligence Olympiad (IAIO) held in Riyadh, Saudi Arabia in 2024, the Bangladesh team won 2 Silver Medals and 2 Bronze Medals. The silver medals were won by Misbah Uddin Inan (Notre Dame College) and Arefin Anwar (Saint Joseph College), while the bronze medals were achieved by Abrar Shahid (Notre Dame College) and Rafid Ahmed (Academia, Lalmatia). The team was led by Dr. B. M. Mainul Hossain, Director at the Institute of Information Technology, University of Dhaka.",
      ],
    },

    contact: {
      title: "Get In Touch",
      emailLabel: "E-Mail",
      officeLabel: "Office",
      office: "Green City Center, Level 12, 758 Satmasjid Road, Dhaka 1209, Bangladesh",
    },

    syllabus: {
      title: "Competition Syllabus",
      lead: "Comprehensive topics and areas covered in BdAIO and international rounds.",
      noteTitle: "Preparing for the International Olympiad?",
      noteBody:
        "The national contest syllabus is aligned with the International Olympiad on Artificial Intelligence (IOAI) and International AI Olympiad (IAIO) benchmarks. Make sure to review previous years' Kaggle competition datasets.",
    },
  },

  offline: {
    title: "You are offline",
    body: "We could not reach BdAIO because your device has no internet connection. Your work is not lost — reconnect and try again.",
  },

  footer: {
    copyright: "Bangladesh Artificial Intelligence Olympiad",
    followUs: "Follow us",
  },
};

export type Dictionary = typeof en;
