import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { dictionaryFor } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/forgot-password">,
): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/forgot-password",
    title: "Forgot password"
  });
}

export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await params;
  const dict = dictionaryFor(locale);
  const t = dict.auth;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">{t.forgotTitle}</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        {t.forgotBody}
      </p>

      <div className="mt-6">
        <ForgotPasswordForm t={t} />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        {t.rememberedIt}{" "}
        <Link href="/login" className="font-semibold text-bdaio-blue hover:underline">
          {dict.common.signIn}
        </Link>
      </p>
    </>
  );
}
