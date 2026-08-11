import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { markMessageHandled } from "@/server/contact/actions";
import { readSort, sortHref } from "@/lib/admin/sort";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Messages" };

/**
 * What may be sorted on, and the ordering each one means.
 *
 * `handledAt` is null while a message is outstanding, and null ordering is
 * where this gets subtle: Postgres puts nulls last on ASC, so asking for
 * `handledAt: asc` and expecting the unanswered ones on top gets you exactly
 * the opposite. Both directions therefore say where nulls go — ascending is
 * "what still needs a reply", descending is "what was dealt with most
 * recently".
 */
const SORTS = {
  status: (dir) => [
    { handledAt: { sort: dir, nulls: dir === "asc" ? "first" : "last" } },
    { createdAt: "desc" },
  ],
  received: (dir) => [{ createdAt: dir }],
  sender: (dir) => [{ name: dir }, { createdAt: "desc" }],
} satisfies Record<
  string,
  (dir: "asc" | "desc") => Prisma.ContactMessageOrderByWithRelationInput[]
>;

type SortKey = keyof typeof SORTS;
const SORT_KEYS = Object.keys(SORTS) as SortKey[];

const SORT_LABELS: Record<SortKey, string> = {
  status: "Outstanding",
  received: "Received",
  sender: "Sender",
};

/**
 * Inbox for the public contact form.
 *
 * Cards rather than a table: a message body is long-form prose of no fixed
 * length, and the whole point of this screen is reading it. So the sort lives
 * in a row of links instead of in column headers — same URL, same primitives
 * as the admin tables, just nowhere to hang a `<th>`.
 *
 * Handled messages are kept rather than deleted — someone will ask what was said.
 */
export default async function AdminMessagesPage(props: PageProps<"/admin/messages">) {
  const params = await props.searchParams;
  const sort = readSort(params, SORT_KEYS, { key: "status", dir: "asc" });

  const messages = await db.contactMessage.findMany({
    orderBy: SORTS[sort.key](sort.dir),
    take: 200,
    include: { user: { select: { email: true } } },
  });

  const outstanding = messages.filter((m) => !m.handledAt).length;

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
      <p className="mt-1 text-sm text-slate-600">
        Sent through the contact form.{" "}
        {outstanding > 0 ? (
          <span className="font-semibold text-amber-700">
            {outstanding} awaiting a reply.
          </span>
        ) : (
          "Nothing outstanding."
        )}
      </p>

      {messages.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white p-5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          No messages yet.
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sort by
            </span>
            {SORT_KEYS.map((key) => {
              const active = sort.key === key;
              return (
                <Link
                  key={key}
                  href={sortHref("/admin/messages", params, sort, key)}
                  aria-current={active ? "true" : undefined}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bdaio-blue/40 ${
                    active
                      ? "bg-bdaio-blue text-white ring-bdaio-blue"
                      : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {SORT_LABELS[key]}
                  <span aria-hidden="true" className={active ? "" : "text-slate-300"}>
                    {active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </Link>
              );
            })}
          </div>

          <ul className="mt-4 space-y-4">
            {messages.map((message) => (
              <li
                key={message.id}
                className={`rounded-xl bg-white p-5 shadow-sm ring-1 ${
                  message.handledAt ? "ring-slate-100 opacity-70" : "ring-amber-200"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">{message.subject}</p>
                  <p className="text-xs text-slate-500">
                    {message.createdAt.toLocaleString("en-GB")}
                  </p>
                </div>

                <p className="mt-1 text-xs text-slate-600">
                  {message.name} ·{" "}
                  {/* mailto rather than a reply box: replies should come from the
                      organiser's own mailbox, so the thread lives where they can
                      find it later. */}
                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                    className="font-medium text-bdaio-blue hover:underline"
                  >
                    {message.email}
                  </a>
                  {message.user && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      signed in
                    </span>
                  )}
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {message.body}
                </p>

                {!message.handledAt && (
                  <form action={markMessageHandled} className="mt-4">
                    <input type="hidden" name="messageId" value={message.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-bdaio-blue ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                    >
                      Mark as handled
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
