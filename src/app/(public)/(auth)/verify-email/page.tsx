import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { verifyEmailToken } from "@/server/auth/actions";
import { dictionaryFor } from "@/lib/i18n";

export const metadata: Metadata = { title: "Verify your email",
  // Carries a single-use token in the query string; robots.ts disallows it too.
  robots: { index: false, follow: false },
};

/** Token outcome → dictionary keys. The copy itself lives in the dictionary. */
const MESSAGE_KEYS = {
  verified: ["verifiedTitle", "verifiedBody"],
  already: ["alreadyTitle", "alreadyBody"],
  expired: ["expiredTitle", "expiredBody"],
  invalid: ["invalidTitle", "invalidBody"],
} as const;

// `searchParams` is a Promise in Next 16 and must be awaited.
export default async function VerifyEmailPage(
  props: PageProps<"/verify-email">,
) {
  const locale = "en";
  const t = dictionaryFor(locale).auth;
  const { token } = await props.searchParams;
  const result = await verifyEmailToken(typeof token === "string" ? token : "");
  const [headingKey, bodyKey] = MESSAGE_KEYS[result];
  const heading = t.verify[headingKey];
  const body = t.verify[bodyKey];

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">{heading}</h1>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      <Link
        href={result === "verified" || result === "already" ? "/login" : "/dashboard"}
        className="mt-6 inline-block text-sm font-semibold text-bdaio-blue hover:underline"
      >
        {result === "verified" || result === "already"
          ? t.goToSignIn
          : t.goToDashboard}
      </Link>
    </>
  );
}
