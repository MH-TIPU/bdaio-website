import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { dictionaryFor } from "@/lib/i18n";

export const metadata: Metadata = { title: "Reset password",
  // Carries a single-use token in the query string; robots.ts disallows it too.
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage(
  props: PageProps<"/[locale]/reset-password">,
) {
  const { locale } = await props.params;
  const t = dictionaryFor(locale).auth;
  const { token } = await props.searchParams;
  const value = typeof token === "string" ? token : "";

  if (!value) {
    return (
      <>
        <h1 className="text-xl font-bold text-slate-900">{t.invalidResetTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {t.invalidResetBody}
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-semibold text-bdaio-blue hover:underline"
        >
          {t.requestNewLink}
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">{t.newPasswordTitle}</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        {t.newPasswordBody}
      </p>

      <div className="mt-6">
        <ResetPasswordForm token={value} />
      </div>
    </>
  );
}
