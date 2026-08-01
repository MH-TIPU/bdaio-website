import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { LoginForm } from "./LoginForm";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/login">,
): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/login",
    title: "Sign in",
    description: "Sign in to your BdAIO account."
  });
}

export default async function LoginPage(props: PageProps<"/[locale]/login">) {
  if (await getCurrentUser()) redirect("/dashboard");

  const { reset } = await props.searchParams;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        Welcome back to BdAIO.
      </p>

      {reset === "1" && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
        >
          Your password has been updated. Please sign in.
        </p>
      )}

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-4 text-center text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-slate-600 hover:text-bdaio-blue hover:underline"
        >
          Forgot your password?
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-slate-600">
        New to BdAIO?{" "}
        <Link
          href="/register"
          className="font-semibold text-bdaio-blue hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
