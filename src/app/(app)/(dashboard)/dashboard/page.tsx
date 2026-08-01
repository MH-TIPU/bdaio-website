import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { VerifyEmailNotice } from "@/components/dashboard/VerifyEmailNotice";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const name = user.profile?.fullName ?? user.email;

  const registrationCount = await db.registration.count({
    where: { userId: user.id, status: { not: "WITHDRAWN" } },
  });

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Welcome, {name}</h1>
      <p className="mt-1 text-sm text-slate-600">{user.email}</p>

      {!user.emailVerifiedAt && <VerifyEmailNotice />}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/profile"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
        >
          <h2 className="text-sm font-semibold text-slate-900">My Profile</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Complete your details before registering.
          </p>
        </Link>

        <Link
          href="/dashboard/registrations"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            My Registrations
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            {registrationCount === 0
              ? "Browse events and sign up."
              : `${registrationCount} active ${registrationCount === 1 ? "entry" : "entries"}.`}
          </p>
        </Link>

        {/* Modules that arrive in later phases. */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            My Achievements
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Medals and badges appear here.
          </p>
        </div>
      </div>
    </>
  );
}
