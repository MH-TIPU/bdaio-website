import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { RegisterForm } from "./RegisterForm";
import { dictionaryFor } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/register">,
): Promise<Metadata> {
  const { locale } = await params;
  const t = dictionaryFor(locale).auth;
  return pageMetadata({
    locale,
    path: "/register",
    title: t.registerTitle,
    description: t.registerSubtitle,
  });
}

export default async function RegisterPage({
  params,
}: PageProps<"/[locale]/register">) {
  if (await getCurrentUser()) redirect("/dashboard");

  const { locale } = await params;
  const dict = dictionaryFor(locale);
  const t = dict.auth;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">{t.registerTitle}</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        {t.registerSubtitle}
      </p>

      <div className="mt-6">
        <RegisterForm t={t} />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        {t.haveAccount}{" "}
        <Link
          href="/login"
          className="font-semibold text-bdaio-blue hover:underline"
        >
          {dict.common.signIn}
        </Link>
      </p>
    </>
  );
}
