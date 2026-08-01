import type { Metadata } from "next";
import { Link } from "@/components/Link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
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

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Forgot your password?</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        Enter your email and we&rsquo;ll send you a link to reset it.
      </p>

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-bdaio-blue hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
