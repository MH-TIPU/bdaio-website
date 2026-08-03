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
    learn: "Courses",
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
    pastSessions: "Past sessions",
    pastEditions: "Past editions",
    currentUpcoming: "Current & upcoming",
    communityRoles: "Community roles",
    contributions: "Contributions",
    notRecognised: "Not recognised",
    noExternalLinks: "No external news links yet",
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
    signingIn: "Signing in…",
    passwordUpdated: "Your password has been updated. Please sign in.",
    forgotTitle: "Forgot your password?",
    forgotBody: "Enter your email and we\u2019ll send you a link to reset it.",
    rememberedIt: "Remembered it?",
    registerSubtitle: "One account for every BdAIO olympiad, workshop, and course.",
    /** Shown in place of the sign-up form while `signup.enabled` is off. */
    registerClosedTitle: "Registration is closed",
    registerClosedBody:
      "New accounts are not being accepted at the moment. Existing accounts still work — sign in as usual, or get in touch if you need help.",
    passwordHint: "At least 8 characters, with a letter and a number.",
    creatingAccount: "Creating account…",
    createAccount: "Create account",
    sending: "Sending…",
    sendResetLink: "Send reset link",
    newPasswordTitle: "Choose a new password",
    newPasswordBody: "Signing in elsewhere will end once your password changes.",
    savePassword: "Save password",
    invalidResetTitle: "Invalid reset link",
    invalidResetBody: "This link is missing its reset token. Please request a new one.",
    requestNewLink: "Request a new link",
    goToSignIn: "Go to sign in",
    goToDashboard: "Go to dashboard",
    /** The four outcomes of consuming an email-verification token. */
    verify: {
      verifiedTitle: "Email verified",
      verifiedBody:
        "Thank you — your email address is confirmed and your account is now active.",
      alreadyTitle: "Already verified",
      alreadyBody:
        "This email address has already been verified. You can sign in as usual.",
      expiredTitle: "Link expired",
      expiredBody:
        "This verification link has expired. Sign in and request a new one from your dashboard.",
      invalidTitle: "Invalid link",
      invalidBody: "This verification link is not valid. It may have already been used.",
    },
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
    learn: {
      title: "Courses",
      lead: "Self-paced courses that build the skills the olympiad asks for. Work through them in your own time; finish one and the certificate is yours.",
      empty: "No courses have been published yet.",
      membersOnly: "more available to signed-in members",
      enrol: "Enrol on this course",
      continue: "Continue",
      start: "Start learning",
      enrolled: "You are enrolled",
      lessons: "lessons",
      minutes: "min",
      syllabus: "What you will cover",
      certificateNote: "Finish every lesson and pass every quiz to earn a certificate.",
      signInToEnrol: "Sign in to enrol",
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
      phoneLabel: "Phone",
      // The address itself is a site setting, not a translation string: an
      // organisation that moves should not need a deploy to say so.
      officeLabel: "Office",
      formTitle: "Send us a message",
      formName: "Your name",
      formEmail: "Your email",
      formSubject: "Subject",
      formMessage: "Message",
      formSubmit: "Send message",
      formSending: "Sending…",
    },

    home: {
      /** Visually hidden h1 on the home page — the hero itself is artwork. */
      heroHeading: "Bangladesh Artificial Intelligence Olympiad",
      introTitle: "What is BdAIO?",
      introBody:
        "The Bangladesh Artificial Intelligence Olympiad (BdAIO) is the premier national competition designed to discover, groom, and inspire young minds in AI. Students up to Grade 12 showcase their skills in Python coding, machine learning models, and algorithm development. BdAIO acts as the official pathway to represent the country on the global stage, including IOAI and IAIO.",
      introCta: "Learn More About Us",
      missionTitle: "Our Mission",
      missionBody:
        "Inspire and enable young minds to master Artificial Intelligence through structured competitive platforms, community mentorship, and real-world AI modeling tasks.",
      gatewayTitle: "International Gateway",
      gatewayBody:
        "BdAIO is the official national qualifying event where top-performing students are selected to represent Bangladesh globally at the International AI Olympiad (IAIO) and IOAI.",

      achievementBadge: "Historic Achievement",
      achievementTitle: "Bangladesh at APOAI 2026!",
      /** Split so the medal count can stay visually emphasised in both languages. */
      achievementLead: "Team Bangladesh has achieved an extraordinary milestone at the",
      achievementEvent: "Asia-Pacific Olympiad in Artificial Intelligence (APOAI) 2026",
      achievementWinning: ", winning",
      achievementMedals: "3 Gold Medals",
      goldMedalist: "Gold Medalist",

      journeyTitle: "Olympiad Journey",
      journeyLead:
        "Follow the path from registration to representing Bangladesh on the global stage.",
      journeyCommunity: "Connect with the Community",
      journeyCommunityBody:
        "Join our active community of learners, mentors, and past winners on WhatsApp. Get help, resources, and instant updates!",
      journeyCommunityCta: "Join Our WhatsApp Community",
      /** Steps keep their numbers and links in code; only the words are here. */
      journeySteps: [
        {
          title: "Register",
          description: "Sign up and register for Quiz or AI Problem Solving.",
          button: "How to Register",
        },
        {
          title: "Qualify",
          description: "Compete and pass the online/regional rounds from 2 – 10 May 2026.",
          button: "View Rules",
        },
        {
          title: "Compete",
          description: "Ace the national-level round in Dhaka on 16 May 2026.",
          button: "View Syllabus",
        },
        {
          title: "Selection",
          description:
            "Join the intensive 3-day Selection Camp & Grooming from 18 – 20 May 2026.",
          button: "Event Schedule",
        },
        {
          title: "Represent",
          description: "Represent Bangladesh globally at IAIO and IOAI.",
          button: "Our Archives",
        },
      ],
    },

    faq: {
      // The FAQ *content* is Bengali-only for now (the rows came from the old
      // site). This heading was hardcoded Bengali even on the English page.
      title: "Frequently Asked Questions",
      empty: "No questions have been published yet.",
    },

    news: {
      kicker: "BdAIO Updates",
      title: "News",
      lead: "Official announcements, achievements, event updates, and stories from the Bangladesh Artificial Intelligence Olympiad.",
      libraryCta: "News Link Library",
      coverageTitle: "External Media Coverage",
      coverageBody:
        "Find direct links to BdAIO coverage from outlets such as Prothom Alo, Kaler Kantho, and other media.",
      openLibrary: "Open Library",
      emptyTitle: "No news published yet",
      emptyBody: "The first BdAIO news post will appear here once it is added.",
    },

    archives: {
      title: "Archives",
      lead: "A history of Bangladesh's journey and achievements at international AI Olympiads.",
      kicker: "Olympiad Archive",
      achievements: "Team Achievements",
      highlights: "Highlights",
      gallery: "Activities Gallery",
    },

    /**
     * Four rule cards. Icons and card order stay in the page; only the words are
     * here, and bullets are plain strings — the inline <strong> the English
     * markup used does not survive translation, where the emphasised phrase
     * lands in a different place.
     */
    rules: {
      title: "Competition Rules",
      lead: "Rules, eligibility criteria, and segment guidelines for BdAIO 2026.",
      cards: [
        {
          title: "Eligibility",
          items: [
            "Students up to Grade 12 or equivalent may participate.",
            "Polytechnic students up to the 4th semester are eligible.",
            "University students are not eligible for this competition.",
            "Participants can register for Quiz, AI Problem Solving, or both segments.",
          ],
        },
        {
          title: "Competition Phases",
          items: [
            "Regional Round: online and regional rounds held in May 2026.",
            "National Round: top qualifiers compete at the national final round.",
            "Selection Camp: top performers participate in grooming sessions.",
            "International Gateway: best camp students selected for IAIO / IOAI.",
          ],
        },
        {
          title: "AI Segment Rules",
          items: [
            "All programming and modeling must be done on the Kaggle platform.",
            "Usage of LLM assistants (ChatGPT, Gemini, Claude, etc.) is strictly prohibited.",
            "Notebooks must remain private and shared with organizers upon request.",
            "Submission files must exactly match the required template CSV format.",
          ],
        },
        {
          title: "Quiz Segment Rules",
          items: [
            "Quiz registration is completely free of charge.",
            "Questions are formulated in both Bengali and English.",
            "Participants compete individually; team setups are not allowed.",
          ],
        },
      ],
      ctaTitle: "Ready to participate?",
      ctaBody:
        "Read our step-by-step registration instructions, learning playlists, and Kaggle guidelines.",
      ctaButton: "Read Participation Guideline",
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
