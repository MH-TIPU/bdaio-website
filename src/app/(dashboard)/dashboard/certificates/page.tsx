import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "My Certificates" };

export default async function CertificatesPage() {
  const user = await requireUser();

  const certificates = await db.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
    include: { event: { select: { title: true } } },
  });

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">My Certificates</h1>
      <p className="mt-1 text-sm text-slate-600">
        Download your certificates as PDFs. Each one carries a number anyone can
        verify.
      </p>

      {certificates.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          You have no certificates yet. They appear here once BdAIO issues them
          for an event you took part in.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {certificates.map((certificate) => (
            <li
              key={certificate.id}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-900">
                    {certificate.title}
                  </p>
                  {certificate.event && (
                    <p className="text-sm text-slate-600">
                      {certificate.event.title}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {certificate.serial}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Issued{" "}
                    {certificate.issuedAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {certificate.revokedAt ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    Revoked
                  </span>
                ) : (
                  <a
                    href={`/api/certificates/${certificate.serial}`}
                    className="rounded-lg bg-bdaio-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
