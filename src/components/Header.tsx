"use client";

import { Link } from "@/components/Link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "@/data/navigation";
import { localePath, splitLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { LanguageToggle } from "./LanguageToggle";
import { Logo } from "./Logo";

/**
 * Active-state matching runs on the **locale-stripped** path, so `/bn/events`
 * highlights Events exactly as `/en/events` does. Comparing raw pathnames would
 * silently break every highlight in the non-default language.
 */
function isActive(pathname: string, href: string, children?: { href: string }[]) {
  const { rest } = splitLocale(pathname);
  if (href === "/") return rest === "/";
  if (rest === href || rest.startsWith(href + "/")) return true;
  return children?.some((c) => rest === c.href || rest.startsWith(c.href + "/")) ?? false;
}

/**
 * One definition of a nav item's size and spacing.
 *
 * There used to be four hand-written variants of this — `px-3.5`, `px-3`,
 * `px-2.5` — which is how a menu ends up looking different depending on which
 * branch rendered it. Shared, so they cannot drift again.
 */
const NAV_ITEM = "px-2.5 py-2 font-semibold transition-colors duration-200";

/**
 * Bengali labels are rendered a notch smaller than English ones.
 *
 * Not a fudge: Bengali script carries a taller x-height and matras above and
 * below the baseline, so Hind Siliguri at 14px occupies visibly more room than
 * Inter at 14px. Ten menu items in Bengali at the Latin size crowd the header
 * and read as oversized next to the logo. 13px against 14px is the size at
 * which the two scripts look like the same menu.
 *
 * The font itself matters as much as the size. Without `font-bengali` these
 * labels fall out of Inter — which has no Bengali glyphs — into whatever the
 * operating system supplies, so the nav looked different on every device and
 * none of them were the typeface the site loads.
 */
function navText(locale: Locale): string {
  return locale === "bn" ? "font-bengali text-[13px]" : "text-sm";
}

export function Header({ locale, t }: { locale: Locale; t: Dictionary }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  /** Nav hrefs are stored locale-free; every link gets the active prefix. */
  const href = (path: string) => localePath(locale, path);
  const text = navText(locale);

  return (
    <header className="site-header sticky top-0 z-50 border-b py-4 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo locale={locale} />

        {/* Desktop Navigation - Clean text links matching screenshots */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.children);
            const label = t.nav[item.key];
            if (item.children) {
              return (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.key)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1 focus:outline-none ${NAV_ITEM} ${text} ${
                      active
                        ? "text-bdaio-blue-dark"
                        : "text-bdaio-gray hover:text-bdaio-blue-dark"
                    }`}
                  >
                    {label}
                    <svg
                      className="h-3 w-3 text-bdaio-gray"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === item.key && (
                    <div className="site-nav-panel absolute left-0 top-full mt-1 min-w-[200px] rounded-lg border p-1 shadow-lg animate-in fade-in duration-100">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={href(child.href)}
                          className={`block rounded text-bdaio-gray hover:bg-bdaio-gray-light hover:text-bdaio-blue-dark ${NAV_ITEM} ${text}`}
                        >
                          {t.nav[child.key]}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={href(item.href)}
                className={`${NAV_ITEM} ${text} ${
                  active
                    ? "text-bdaio-blue-dark"
                    : "text-bdaio-gray hover:text-bdaio-blue-dark"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle locale={locale} t={t} />

          {/* Mobile menu button */}
          <button
            className="rounded-lg p-2 text-bdaio-gray transition-colors hover:bg-bdaio-gray-light lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={mobileOpen}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <nav className="site-nav-panel border-t px-4 py-4 lg:hidden max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.key} className="p-1">
                {item.children ? (
                  <>
                    <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-bdaio-gray">
                      {t.nav[item.key]}
                    </p>
                    <div className="mt-1 ml-2 border-l border-bdaio-blue/15 pl-3 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={href(child.href)}
                          onClick={() => setMobileOpen(false)}
                          className={`block rounded text-bdaio-gray hover:text-bdaio-blue-dark ${NAV_ITEM} ${text}`}
                        >
                          {t.nav[child.key]}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={href(item.href)}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded ${NAV_ITEM} ${text} ${
                      isActive(pathname, item.href)
                        ? "text-bdaio-blue-dark"
                        : "text-bdaio-gray hover:text-bdaio-blue-dark"
                    }`}
                  >
                    {t.nav[item.key]}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
