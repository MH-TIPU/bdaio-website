import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Check whether a BdAIO certificate is genuine.",
  // Public but not indexable: a verification link is for the person holding the
  // certificate, and every one of these URLs shows a recipient's name. Search
  // results full of certificate serials would turn a verification tool into a
  // directory of participants. robots.ts disallows /verify/ as well.
  robots: { index: false, follow: false },
};

/**
 * Public verification. Anyone holding a certificate can confirm it is genuine,
 * so this deliberately needs no login — but it reveals only what a verifier
 * needs: the name on the certificate, what it was for, and whether it stands.
 *
 * Dynamic, unlike its neighbours, and deliberately opting out of the layout's
 * `revalidate = 60`. Under ISR the answer for a serial is cached — including
 * "no such certificate", which is what a serial returns in the seconds before
 * it is issued and after it is revoked. A verification tool that says *invalid*
 * for a minute about a certificate that is valid, or *valid* about one just
 * revoked, is worse than a slow one. Traffic here is a trickle of one-off
 * lookups, so there is nothing to gain by caching them anyway.
 */
export const dynamic = "force-dynamic";
export default async function VerifyCertificatePage(
  props: PageProps<"/verify/[serial]">,
) {
  const { serial } = await props.params;

  const certificate = await db.certificate.findUnique({
    where: { serial },
    select: {
      serial: true,
      title: true,
      recipientName: true,
      detail: true,
      issuedAt: true,
      revokedAt: true,
      event: { select: { title: true, year: true } },
    },
  });

  const valid = certificate && !certificate.revokedAt;

  return (
    <section className="bg-slate-50/50 py-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Certificate verification
        </h1>
        <p className="mt-1 font-mono text-sm text-slate-500">{serial}</p>

        <div
          className={`mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ${
            valid ? "ring-emerald-200" : "ring-red-200"
          }`}
        >
          {!certificate ? (
            <>
              <p className="text-lg font-bold text-red-700">Not recognised</p>
              <p className="mt-1 text-sm text-slate-600">
                No BdAIO certificate exists with this number. Please check the
                number printed on the document.
              </p>
            </>
          ) : certificate.revokedAt ? (
            <>
              <p className="text-lg font-bold text-red-700">Revoked</p>
              <p className="mt-1 text-sm text-slate-600">
                This certificate was issued but has since been revoked and is no
                longer valid.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-emerald-700">✓ Genuine</p>
              <dl className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Awarded to
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold text-slate-900">
                    {certificate.recipientName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Certificate
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-900">
                    {certificate.title}
                    {certificate.event ? ` — ${certificate.event.title}` : ""}
                  </dd>
                </div>
                {certificate.detail && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Detail
                    </dt>
                    <dd className="mt-0.5 text-sm text-slate-900">
                      {certificate.detail}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Issued
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-900">
                    {certificate.issuedAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
