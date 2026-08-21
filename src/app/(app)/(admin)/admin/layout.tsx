import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/dal";
import { logout } from "@/server/auth/actions";
import { AdminNav, type NavGroup } from "@/components/admin/AdminNav";
import { ADMIN_NAV_COOKIE, parseCollapsed } from "@/lib/admin/nav";

/**
 * Grouped by what an organiser is trying to do, not by which phase built it.
 *
 * The order within each group runs from the thing opened most often to the
 * thing opened least.
 */
const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/registrations", label: "Registrations" },
      { href: "/admin/institutions", label: "Institutions" },
      { href: "/admin/community", label: "Community roles" },
    ],
  },
  {
    label: "Competitions",
    items: [
      { href: "/admin/events", label: "Events" },
      { href: "/admin/programs", label: "Programs" },
      { href: "/admin/results", label: "Results" },
      { href: "/admin/certificates", label: "Certificates" },
    ],
  },
  {
    label: "Learning",
    items: [
      { href: "/admin/courses", label: "Courses" },
      { href: "/admin/resources", label: "Resources" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/announcements", label: "Announcements" },
      { href: "/admin/content", label: "Pages" },
      { href: "/admin/faq", label: "FAQ" },
      { href: "/admin/media", label: "Media" },
      { href: "/admin/sponsors", label: "Sponsors" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/email", label: "Email queue" },
      { href: "/admin/logs", label: "Audit log" },
      { href: "/admin/settings", label: "Site settings" },
    ],
  },
];

import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Guard for the whole section; each action re-checks independently.
  const admin = await requireRole("ADMIN");
  // Free to read: the guard above has already made this layout dynamic.
  const collapsed = parseCollapsed((await cookies()).get(ADMIN_NAV_COOKIE)?.value);
  const name = admin.profile?.fullName ?? admin.email;
  const handle = admin.profile?.handle ? `@${admin.profile.handle}` : admin.email;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Standalone Admin Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="rounded-md bg-purple-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-700">
                Admin Console
              </span>
              <Link
                href="/dashboard"
                className="text-xs font-medium text-slate-500 hover:text-bdaio-blue transition"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              {admin.profile?.photo ? (
                <Image
                  src={admin.profile.photo}
                  alt={name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 font-bold text-xs text-white">
                  {name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 line-clamp-1">{name}</p>
                <p className="text-[10px] text-slate-500 line-clamp-1">{handle}</p>
              </div>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-red-600 transition"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Admin Layout */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <AdminNav groups={NAV} collapsed={collapsed} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
