import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * The site navigation.
 *
 * Items carry a **dictionary key**, not a label: the label is looked up per
 * locale at render time. Keeping the key here rather than the English string is
 * what makes the nav translatable without a second copy of this structure — and
 * because the key is typed against the dictionary, a renamed key fails the build
 * instead of rendering `undefined` in the header.
 *
 * `href` is always locale-free; the header prefixes it with the active locale.
 */
export type NavKey = keyof Dictionary["nav"];

export type NavItem = {
  key: NavKey;
  href: string;
  children?: { key: NavKey; href: string }[];
};

/**
 * Eight top-level items, not ten.
 *
 * Ten crowded the header — badly enough in Bengali, whose script needs more room
 * per label, that the two languages had to be set at different sizes to fit. The
 * pages that were only ever one click deep now sit under the heading they belong
 * to: About with Contact, and FAQ with the other things a participant reads
 * before entering.
 *
 * A parent renders as a dropdown trigger rather than a link, so anything that
 * has children also appears *as* a child — otherwise the parent's own page
 * becomes unreachable from the menu.
 */
export const navItems: NavItem[] = [
  { key: "home", href: "/" },
  {
    key: "about",
    href: "/about",
    children: [
      { key: "aboutBdaio", href: "/about" },
      { key: "contact", href: "/contact" },
    ],
  },
  {
    key: "compete",
    href: "/programs",
    children: [
      { key: "programs", href: "/programs" },
      { key: "events", href: "/events" },
      { key: "workshops", href: "/workshops" },
    ],
  },
  {
    key: "community",
    href: "/institutions",
    children: [
      { key: "institutions", href: "/institutions" },
      { key: "registerInstitution", href: "/institutions/register" },
    ],
  },
  { key: "results", href: "/results" },
  { key: "announcements", href: "/announcements" },
  { key: "news", href: "/news" },
  {
    key: "resources",
    href: "/resources",
    children: [
      { key: "resourceLibrary", href: "/resources" },
      { key: "learn", href: "/learn" },
      { key: "syllabus", href: "/syllabus" },
      { key: "participationGuideline", href: "/participation-guideline" },
      { key: "faq", href: "/faq" },
    ],
  },
];
