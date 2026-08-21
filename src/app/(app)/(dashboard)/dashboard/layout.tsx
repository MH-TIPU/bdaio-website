import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth/dal";
import { logout } from "@/server/auth/actions";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Logo } from "@/components/Logo";

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
  const handle = user.profile?.handle ? `@${user.profile.handle}` : user.email;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Standalone Dashboard Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="rounded-md bg-bdaio-blue/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-bdaio-blue">
                Dashboard
              </span>
              <Link
                href="/en"
                className="text-xs font-medium text-slate-500 hover:text-bdaio-blue transition"
              >
                ← Back to Main Site
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(user.role === "ADMIN" || String(user.role) === "SUPER_ADMIN" || String(user.role) === "SYSTEM_ADMIN") && (
              <Link
                href="/admin"
                className="rounded-lg bg-bdaio-blue/10 px-3 py-1.5 text-xs font-bold text-bdaio-blue hover:bg-bdaio-blue/20 transition"
              >
                ⚡ Admin Portal
              </Link>
            )}

            {user.profile?.handle && user.profile.visibility === "PUBLIC" && (
              <Link
                href={`/u/${user.profile.handle}`}
                className="hidden md:inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                🌐 Public Profile
              </Link>
            )}

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              {user.profile?.photo ? (
                <Image
                  src={user.profile.photo}
                  alt={name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bdaio-blue font-bold text-xs text-white">
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

      {/* Main Dashboard Layout */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <DashboardNav items={NAV} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
