export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Compete",
    href: "/programs",
    children: [
      { label: "Programs", href: "/programs" },
      { label: "Events", href: "/events" },
      { label: "Workshops & Courses", href: "/workshops" },
    ],
  },
  {
    label: "Community",
    href: "/institutions",
    children: [
      { label: "Institutions & Clubs", href: "/institutions" },
      { label: "Register your institution", href: "/institutions/register" },
    ],
  },
  { label: "Results", href: "/results" },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Resource library", href: "/resources" },
      { label: "Syllabus", href: "/syllabus" },
      { label: "Participation Guideline", href: "/participation-guideline" },
    ],
  },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];
