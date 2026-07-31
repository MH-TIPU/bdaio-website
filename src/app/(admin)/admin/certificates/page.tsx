import type { Metadata } from "next";
import { db } from "@/lib/db";
import { issueEventCertificates, revokeCertificate } from "@/server/journey/actions";
import { SELECT_CLASS } from "@/components/admin/formStyles";

export const metadata: Metadata = { title: "Certificates · Admin" };

export default async function AdminCertificatesPage() {
  const [events, certificates] = await Promise.all([
    db.event.findMany({
      orderBy: [{ year: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        _count: { select: { registrations: true, certificates: true } },
      },
    }),
    db.certificate.findMany({
      orderBy: { issuedAt: "desc" },
      take: 100,
      include: {
        user: { select: { email: true } },
        event: { select: { title: true } },
      },
    }),
  ]);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
      <p className="mt-1 text-sm text-slate-600">
        Issue certificates to every <strong>approved</strong> participant of an
        event. Running it again only fills gaps, so it is safe to repeat.
      </p>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Issue for an event</h2>
        <form action={issueEventCertificates} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="eventId" className="block text-sm font-medium text-slate-700">
              Event
            </label>
            <select id="eventId" name="eventId" className={SELECT_CLASS}>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} ({event._count.certificates}/
                  {event._count.registrations} issued)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-700">
              Type
            </label>
            <select id="type" name="type" className={SELECT_CLASS}>
              <option value="PARTICIPATION">Participation</option>
              <option value="MERIT">Merit</option>
              <option value="MEDAL">Achievement (medal)</option>
              <option value="APPRECIATION">Appreciation</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-bdaio-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bdaio-blue-dark"
          >
            Issue
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Serial</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Recipient</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Event</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {certificates.map((certificate) => (
              <tr key={certificate.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">
                  {certificate.serial}
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-900">{certificate.recipientName}</p>
                  <p className="text-xs text-slate-500">{certificate.user.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {certificate.event?.title ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {certificate.revokedAt ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      Revoked
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Valid
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={revokeCertificate}>
                    <input type="hidden" name="certificateId" value={certificate.id} />
                    <button
                      type="submit"
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${
                        certificate.revokedAt
                          ? "text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
                          : "text-red-600 ring-red-200 hover:bg-red-50"
                      }`}
                    >
                      {certificate.revokedAt ? "Restore" : "Revoke"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {certificates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No certificates issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
