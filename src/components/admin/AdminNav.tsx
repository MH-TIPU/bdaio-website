"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavGroup = {
  label: string;
  items: { href: string; label: string }[];
};

/**
 * The admin sidebar, grouped.
 *
 * Twenty-one links in one flat column meant finding "Email queue" was a scan of
 * the whole list every time — nothing told you roughly where to look. Grouping
 * turns that scan into two steps: pick the heading, then the item under it.
 *
 * `startsWith` for the active state, so `/admin/courses/abc123` still highlights
 * Courses. `/admin` is matched exactly, or Overview would light up everywhere.
 */
export function AdminNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="lg:sticky lg:top-6" aria-label="Administration">
      <div className="flex gap-4 overflow-x-auto pb-2 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
        {groups.map((group) => (
          <div key={group.label} className="min-w-max lg:min-w-0">
            <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <div className="flex gap-1 lg:flex-col">
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
          </div>
        ))}
      </div>
    </nav>
  );
}
