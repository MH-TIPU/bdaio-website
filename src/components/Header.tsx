"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "@/data/navigation";
import { Logo } from "./Logo";

function isActive(pathname: string, href: string, children?: { href: string }[]) {
  if (href === "/") return pathname === "/";
  if (pathname === href || pathname.startsWith(href + "/")) return true;
  return children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")) ?? false;
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white py-4 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop Navigation - Clean text links matching screenshots */}
        <nav className="hidden items-center gap-1.5 lg:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.children);
            if (item.children) {
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1 px-3.5 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none ${
                      active
                        ? "text-[#1e5a8a]"
                        : "text-slate-600 hover:text-[#1e5a8a]"
                    }`}
                  >
                    {item.label}
                    <svg
                      className="h-3 w-3 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === item.label && (
                    <div className="absolute left-0 top-full mt-1 min-w-[200px] rounded-lg border border-slate-100 bg-white p-1 shadow-lg animate-in fade-in duration-100">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#1e5a8a] transition-colors"
                        >
                          {child.label}
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
                href={item.href}
                className={`px-3.5 py-2 text-sm font-semibold transition-colors duration-200 ${
                  active
                    ? "text-[#1e5a8a]"
                    : "text-slate-600 hover:text-[#1e5a8a]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 lg:hidden transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
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

      {/* Mobile Navigation */}
      {mobileOpen && (
        <nav className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.label} className="p-1">
                {item.children ? (
                  <>
                    <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </p>
                    <div className="mt-1 ml-2 border-l border-slate-100 pl-3 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block rounded px-2.5 py-2 text-sm font-semibold text-slate-600 hover:text-[#1e5a8a] transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive(pathname, item.href)
                        ? "text-[#1e5a8a]"
                        : "text-slate-700 hover:text-[#1e5a8a]"
                    }`}
                  >
                    {item.label}
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
