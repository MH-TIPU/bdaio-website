"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { writeCollapsed } from "@/lib/admin/nav";

export type NavGroup = {
  label: string;
  items: { href: string; label: string }[];
};

/**
 * The admin sidebar, grouped and collapsible.
 *
 * Twenty-one links in one flat column meant finding "Email queue" was a scan of
 * the whole list every time — nothing told you roughly where to look. Grouping
 * turned that scan into two steps: pick the heading, then the item under it.
 * Folding goes one further, because most organisers live in two or three of
 * these six and read past the rest on every page.
 *
 * `<details>`/`<summary>` rather than a button and a state flag: the disclosure
 * semantics, the keyboard handling and the expanded state a screen reader
 * announces all come for free, and it still folds with JavaScript off — just
 * without remembering afterwards.
 *
 * The open groups arrive from the server (a cookie, see `src/lib/admin/nav`), so
 * the first paint is already correct and state here only keeps the click
 * instant rather than waiting on a round trip.
 *
 * `startsWith` for the active state, so `/admin/courses/abc123` still highlights
 * Courses. `/admin` is matched exactly, or Overview would light up everywhere.
 */
export function AdminNav({
  groups,
  collapsed: initialCollapsed,
}: {
  groups: NavGroup[];
  collapsed: string[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const activeGroup = groups.find((g) => g.items.some((i) => isActive(i.href)))?.label;

  const toggle = (label: string, open: boolean) => {
    // `toggle` fires whenever the attribute changes, including when React sets
    // it. Only a real change is worth recording.
    if (open !== collapsed.includes(label)) return;

    const next = open ? collapsed.filter((l) => l !== label) : [...collapsed, label];
    setCollapsed(next);
    writeCollapsed(next);
  };

  /*
   * `className` rather than one fixed value, because hiding the folded items
   * cannot be left to the browser. A `<details>` hides its own content, but only
   * while that content keeps the display the UA gave it — Tailwind's `flex` on
   * the direct child overrides it, and the links then paint at full size over
   * the group below while the `<details>` itself sits collapsed at 21px.
   * Driving it from `[open]` instead is both explicit and still native, so a
   * folded group stays folded with JavaScript off.
   */
  const items = (group: NavGroup, className: string) => (
    <div className={className}>
      {group.items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-bdaio-blue shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:bg-white/70 hover:text-bdaio-blue"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  const HEADING =
    "px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400";

  return (
    <nav className="lg:sticky lg:top-6" aria-label="Administration">
      <div className="flex gap-4 overflow-x-auto pb-2 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
        {groups.map((group) => {
          /*
           * The group holding the current page is a plain heading, not a
           * disclosure. A sidebar that can hide the page you are on has stopped
           * answering the one question a sidebar is for — and offering a control
           * that reopens itself the moment you use it is worse than not
           * offering it. Missing chevron says "not this one" on its own.
           */
          if (group.label === activeGroup) {
            return (
              <div key={group.label} className="min-w-max lg:min-w-0">
                <p className={HEADING}>{group.label}</p>
                {items(group, "flex gap-1 lg:flex-col")}
              </div>
            );
          }

          const open = !collapsed.includes(group.label);

          return (
            <details
              key={group.label}
              open={open}
              onToggle={(event) => toggle(group.label, event.currentTarget.open)}
              className="group min-w-max lg:min-w-0"
            >
              <summary
                className={`${HEADING} flex cursor-pointer list-none items-center justify-between gap-2 transition-colors hover:text-slate-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bdaio-blue/40 [&::-webkit-details-marker]:hidden`}
              >
                {group.label}
                <svg
                  aria-hidden="true"
                  className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                    open ? "" : "-rotate-90"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>

              {items(group, "hidden gap-1 group-open:flex lg:flex-col")}
            </details>
          );
        })}
      </div>
    </nav>
  );
}
