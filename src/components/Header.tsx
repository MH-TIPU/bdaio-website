"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Link } from "@/components/Link";
import { navItems } from "@/data/navigation";
import { localePath, splitLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { logout } from "@/server/auth/actions";
import { LanguageToggle } from "./LanguageToggle";
import { Logo } from "./Logo";

import type { AccountRole } from "@/generated/prisma/enums";

export type UserHeaderSession = {
  id: string;
  email: string;
  role: AccountRole | string;
  status: string;
  profile?: {
    id?: string;
    handle?: string | null;
    fullName?: string | null;
    photo?: string | null;
    visibility?: string | null;
  } | null;
} | null;

function isActive(pathname: string, href: string, children?: { href: string }[]) {
  const { rest } = splitLocale(pathname);
  if (href === "/") return rest === "/";
  if (rest === href || rest.startsWith(href + "/")) return true;
  return children?.some((c) => rest === c.href || rest.startsWith(c.href + "/")) ?? false;
}

export function Header({
  locale,
  t,
  user,
}: {
  locale: Locale;
  t: Dictionary;
  user?: UserHeaderSession;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});

  const href = (path: string) => localePath(locale, path);

  const toggleMobileExpand = (key: string) => {
    setMobileExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Close dropdowns when clicking outside the header
  useEffect(() => {
    if (!openDropdown && !userDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest("header")) {
        setOpenDropdown(null);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdown, userDropdownOpen]);

  const displayName = user?.profile?.fullName || user?.email.split("@")[0] || "User";
  const userHandle = user?.profile?.handle ? `@${user.profile.handle}` : user?.email;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        <Logo locale={locale} />

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.children);
            const label = t.nav[item.key];
            if (item.children) {
              const isOpen = openDropdown === item.key;
              return (
                <div key={item.key} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setOpenDropdown(isOpen ? null : item.key);
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      active || isOpen
                        ? "bg-bdaio-blue/10 text-bdaio-blue"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {label}
                    <svg
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-bdaio-blue" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5 animate-in fade-in duration-150 z-50">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={href(child.href)}
                          onClick={() => setOpenDropdown(null)}
                          className="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-bdaio-blue transition"
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
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-bdaio-blue/10 text-bdaio-blue"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls (Auth / User Profile + Language + Mobile Menu) */}
        <div className="flex items-center gap-3">
          <LanguageToggle locale={locale} t={t} />

          {/* User Auth Section */}
          {user ? (
            /* User Profile Dropdown */
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full p-1 pr-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
              >
                {user.profile?.photo ? (
                  <Image
                    src={user.profile.photo}
                    alt={displayName}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bdaio-blue font-bold text-xs text-white ring-2 ring-white shadow-2xs">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-bold text-slate-800 line-clamp-1 max-w-[120px]">
                  {displayName}
                </span>
                <svg
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                    userDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in duration-150 z-50"
                >
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{displayName}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{userHandle}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          user.role === "ADMIN"
                            ? "bg-bdaio-blue/15 text-bdaio-blue"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="py-1.5 space-y-0.5">
                    {(user.role === "ADMIN" || user.role === "SYSTEM_ADMIN") && (
                      <Link
                        href={href("/admin")}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-bdaio-blue hover:bg-bdaio-blue/10 transition"
                      >
                        ⚡ Admin Portal
                      </Link>
                    )}
                    <Link
                      href={href("/dashboard")}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      href={href("/learn")}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      🎓 My Learning / Courses
                    </Link>
                    <Link
                      href={href("/dashboard/profile")}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      👤 My Profile
                    </Link>
                    {user.profile?.handle && user.profile.visibility === "PUBLIC" && (
                      <Link
                        href={href(`/u/${user.profile.handle}`)}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        🌐 Public Profile
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1.5">
                    <form action={logout}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        🚪 Sign Out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Signed Out Buttons */
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href={href("/login")}
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                Sign In
              </Link>
              <Link
                href={href("/register")}
                className="rounded-xl bg-bdaio-blue px-4 py-2 text-xs font-bold text-white hover:bg-bdaio-blue-dark transition shadow-2xs"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 transition lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Responsive Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 lg:hidden max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          {/* Mobile Auth Card */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bdaio-blue font-bold text-sm text-white shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{displayName}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{userHandle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                  {user.role === "ADMIN" && (
                    <Link
                      href={href("/admin")}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg bg-bdaio-blue/10 px-3 py-1.5 text-center text-xs font-bold text-bdaio-blue"
                    >
                      Admin Portal
                    </Link>
                  )}
                  <Link
                    href={href("/dashboard")}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-center text-xs font-bold text-slate-700"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={href("/login")}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  href={href("/register")}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-bdaio-blue px-3 py-2 text-center text-xs font-bold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Accordion Items */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href, item.children);
              const label = t.nav[item.key];
              const isExpanded = !!mobileExpanded[item.key];

              if (item.children) {
                return (
                  <div key={item.key} className="rounded-xl border border-slate-100 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleMobileExpand(item.key)}
                      className={`flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-semibold transition ${
                        active ? "bg-bdaio-blue/10 text-bdaio-blue" : "text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <span>{label}</span>
                      <svg
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="bg-slate-50/70 px-3 py-2 border-t border-slate-100 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={href(child.href)}
                            onClick={() => setMobileOpen(false)}
                            className="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white hover:text-bdaio-blue transition"
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
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-bdaio-blue/10 text-bdaio-blue font-bold"
                      : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
