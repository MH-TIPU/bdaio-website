import { requireRole } from "@/lib/auth/dal";
import { logout } from "@/server/auth/actions";
import { AdminNav, type NavGroup } from "@/components/admin/AdminNav";

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

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Guard for the whole section; each action re-checks independently.
  const admin = await requireRole("ADMIN");

  return (
    <div className="bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Administration
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {admin.profile?.fullName ?? admin.email}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
          <AdminNav groups={NAV} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
