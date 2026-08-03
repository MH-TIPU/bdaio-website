import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { logout } from "@/server/auth/actions";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "My Profile" },
  { href: "/dashboard/registrations", label: "My Registrations" },
  { href: "/dashboard/learning", label: "My Learning" },
  { href: "/dashboard/institution", label: "My Institution" },
  { href: "/dashboard/roles", label: "My Roles" },
  { href: "/dashboard/contributions", label: "My Contributions" },
  { href: "/dashboard/submissions", label: "My Submissions" },
  { href: "/dashboard/results", label: "My Results" },
  { href: "/dashboard/achievements", label: "My Achievements" },
  { href: "/dashboard/certificates", label: "My Certificates" },
  { href: "/dashboard/activity", label: "My Activity" },
  { href: "/dashboard/notifications", label: "Notifications" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const name = user.profile?.fullName ?? user.email;

  return (
    <div className="bg-bdaio-gray-light">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Dashboard
            </p>
            <p className="text-sm font-semibold text-slate-900">{name}</p>
          </div>
          <div className="flex items-center gap-3">
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <Link
                href="/admin"
                className="text-sm font-semibold text-bdaio-blue hover:underline"
              >
                Admin
              </Link>
            )}
            {user.profile?.handle && user.profile.fullName && (
              <Link
                href={`/u/${user.profile.handle}`}
                className="text-sm font-medium text-bdaio-blue hover:underline"
              >
                View public profile
              </Link>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-bdaio-blue ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
          <DashboardNav items={NAV} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
