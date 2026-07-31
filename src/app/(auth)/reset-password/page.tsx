import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage(
  props: PageProps<"/reset-password">,
) {
  const { token } = await props.searchParams;
  const value = typeof token === "string" ? token : "";

  if (!value) {
    return (
      <>
        <h1 className="text-xl font-bold text-slate-900">Invalid reset link</h1>
        <p className="mt-2 text-sm text-slate-600">
          This link is missing its reset token. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-semibold text-bdaio-blue hover:underline"
        >
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        Signing in elsewhere will end once your password changes.
      </p>

      <div className="mt-6">
        <ResetPasswordForm token={value} />
      </div>
    </>
  );
}
