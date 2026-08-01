import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { getCurrentUser } from "@/lib/auth/dal";
import { RegisterInstitutionForm } from "./RegisterInstitutionForm";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/institutions/register">,
): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/institutions/register",
    title: "Register your institution",
    description:
    "Register your school, college, university, or AI club to take part in BdAIO."
  });
}

export default async function RegisterInstitutionPage() {
  const user = await getCurrentUser();

  return (
    <section className="bg-slate-50/50 py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/institutions"
          className="text-sm font-medium text-bdaio-blue hover:underline"
        >
          ← Institutions
        </Link>
        <h1 className="mt-4 text-3xl font-black text-bdaio-blue">
          Register your institution
        </h1>
        <p className="mt-2 text-slate-600">
          Add your school, college, university, or club so your students can take
          part as a group.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Sign in to register an institution.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
              >
                Sign in
              </Link>
            </div>
          ) : !user.emailVerifiedAt ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-800">
                Verify your email address before registering an institution.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
              >
                Verify my email
              </Link>
            </div>
          ) : (
            <RegisterInstitutionForm />
          )}
        </div>
      </div>
    </section>
  );
}
