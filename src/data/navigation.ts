export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  // { label: "Result", href: "/result" },
  {
    label: "Resources",
    href: "/syllabus",
    children: [
      { label: "Syllabus", href: "/syllabus" },
      { label: "Participation Guideline", href: "/participation-guideline" },
    ],
  },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];
