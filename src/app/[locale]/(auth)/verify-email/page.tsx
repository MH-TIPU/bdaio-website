import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailToken } from "@/server/auth/actions";

export const metadata: Metadata = { title: "Verify your email" };

const MESSAGES = {
  verified: {
    heading: "Email verified",
    body: "Thank you — your email address is confirmed and your account is now active.",
  },
  already: {
    heading: "Already verified",
    body: "This email address has already been verified. You can sign in as usual.",
  },
  expired: {
    heading: "Link expired",
    body: "This verification link has expired. Sign in and request a new one from your dashboard.",
  },
  invalid: {
    heading: "Invalid link",
    body: "This verification link is not valid. It may have already been used.",
  },
} as const;

// `searchParams` is a Promise in Next 16 and must be awaited.
export default async function VerifyEmailPage(
  props: PageProps<"/[locale]/verify-email">,
) {
  const { token } = await props.searchParams;
  const result = await verifyEmailToken(typeof token === "string" ? token : "");
  const { heading, body } = MESSAGES[result];

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">{heading}</h1>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      <Link
        href={result === "verified" || result === "already" ? "/login" : "/dashboard"}
        className="mt-6 inline-block text-sm font-semibold text-bdaio-blue hover:underline"
      >
        {result === "verified" || result === "already"
          ? "Go to sign in"
          : "Go to dashboard"}
      </Link>
    </>
  );
}
