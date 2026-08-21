import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { LoginForm } from "./LoginForm";
import { dictionaryFor } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/login">,
): Promise<Metadata> {
  const locale = "en";
  const t = dictionaryFor(locale).auth;
  return pageMetadata({
    locale,
    path: "/login",
    title: t.signInTitle,
    description: t.signInSubtitle,
  });
}

export default async function LoginPage(props: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/dashboard");

  const locale = "en";
  const dict = dictionaryFor(locale);
  const t = dict.auth;
  const { reset } = await props.searchParams;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">{t.signInTitle}</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        {t.signInSubtitle}
      </p>

      {reset === "1" && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
        >
          {t.passwordUpdated}
        </p>
      )}

      <div className="mt-6">
        <LoginForm t={t} />
      </div>

      <p className="mt-4 text-center text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-slate-600 hover:text-bdaio-blue hover:underline"
        >
          {t.forgotPassword}
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-slate-600">
        {t.newHere}{" "}
        <Link
          href="/register"
          className="font-semibold text-bdaio-blue hover:underline"
        >
          {dict.common.signUp}
        </Link>
      </p>
    </>
  );
}
