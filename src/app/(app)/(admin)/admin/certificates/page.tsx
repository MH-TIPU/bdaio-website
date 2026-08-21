import type { Metadata } from "next";
import { db } from "@/lib/db";
import { issueEventCertificates, revokeCertificate } from "@/server/journey/actions";
import { SELECT_CLASS } from "@/components/admin/formStyles";
import {
  ACTION_CLASS,
  DataTable,
  EmptyRow,
  RowActions,
  SortableTh,
  TBody,
  THead,
  Td,
  Th,
  Tr,
} from "@/components/admin/DataTable";
import { readSort, sortHref } from "@/lib/admin/sort";
import type { Prisma } from "@/generated/prisma/client";

import { readPagination } from "@/lib/admin/pagination";
import { Pagination } from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "Certificates · Admin" };

/**
 * What may be sorted on, and the ordering each one means.
 */
const SORTS = {
  serial: (dir) => [{ serial: dir }],
  recipient: (dir) => [{ recipientName: dir }],
  event: (dir) => [{ event: { title: dir } }, { issuedAt: "desc" }],
  status: (dir) => [{ revokedAt: dir }, { issuedAt: "desc" }],
  issued: (dir) => [{ issuedAt: dir }],
} satisfies Record<
  string,
  (dir: "asc" | "desc") => Prisma.CertificateOrderByWithRelationInput[]
>;

type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];

export default async function AdminCertificatesPage(
  props: PageProps<"/admin/certificates">,
) {
  const params = await props.searchParams;
  const sort = readSort(params, SORT_KEYS, { key: "issued", dir: "desc" });
  const { page, pageSize, skip, take } = readPagination(params, 15);

  const [totalCerts, events, certificates] = await Promise.all([
    db.certificate.count(),
    db.event.findMany({
      orderBy: [{ year: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        _count: { select: { registrations: true, certificates: true } },
      },
    }),
    db.certificate.findMany({
      orderBy: SORTS[sort.key](sort.dir),
      skip,
      take,
      include: {
        user: { select: { email: true } },
        event: { select: { title: true } },
      },
    }),
  ]);

  const href = (column: SortKey) =>
    sortHref("/admin/certificates", params, sort, column);

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

      <div className="mt-6">
        <DataTable minWidth={860}>
          <THead>
            <SortableTh column="serial" current={sort} href={href("serial")}>
              Serial
            </SortableTh>
            <SortableTh column="recipient" current={sort} href={href("recipient")}>
              Recipient
            </SortableTh>
            <SortableTh column="event" current={sort} href={href("event")}>
              Event
            </SortableTh>
            <SortableTh column="status" current={sort} href={href("status")}>
              Status
            </SortableTh>
            <SortableTh column="issued" current={sort} href={href("issued")}>
              Issued
            </SortableTh>
            <Th align="right" srOnly="Actions" />
          </THead>

          <TBody>
            {certificates.length === 0 && (
              <EmptyRow colSpan={6}>No certificates issued yet.</EmptyRow>
            )}

            {certificates.map((certificate) => (
              <Tr key={certificate.id}>
                <Td className="font-mono text-xs text-slate-700">
                  {certificate.serial}
                </Td>

                <Td>
                  <p className="text-slate-900">{certificate.recipientName}</p>
                  <p className="text-xs text-slate-500">{certificate.user.email}</p>
                </Td>

                <Td className="text-slate-700">{certificate.event?.title ?? "—"}</Td>

                <Td>
                  {certificate.revokedAt ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      Revoked
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Valid
                    </span>
                  )}
                </Td>

                <Td>
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    {certificate.issuedAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </Td>

                <RowActions>
                  <form action={revokeCertificate}>
                    <input type="hidden" name="certificateId" value={certificate.id} />
                    <button
                      type="submit"
                      className={
                        certificate.revokedAt ? ACTION_CLASS.good : ACTION_CLASS.danger
                      }
                    >
                      {certificate.revokedAt ? "Restore" : "Revoke"}
                    </button>
                  </form>
                </RowActions>
              </Tr>
            ))}
          </TBody>
        </DataTable>

        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalCerts}
          basePath="/admin/certificates"
          searchParams={params}
        />
      </div>
    </>
  );
}
