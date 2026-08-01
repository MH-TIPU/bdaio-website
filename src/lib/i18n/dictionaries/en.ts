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
