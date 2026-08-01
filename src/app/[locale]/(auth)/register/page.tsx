import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { RegisterForm } from "./RegisterForm";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/register">,
): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/register",
    title: "Create an account",
    description:
    "Create a BdAIO account to register for the Bangladesh AI Olympiad, workshops, and more."
  });
}

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        One account for every BdAIO olympiad, workshop, and course.
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-bdaio-blue hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
