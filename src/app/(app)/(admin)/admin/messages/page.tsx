import type { Metadata } from "next";
import { db } from "@/lib/db";
import { markMessageHandled } from "@/server/contact/actions";

export const metadata: Metadata = { title: "Messages" };

/**
 * Inbox for the public contact form.
 *
 * Newest first, unhandled above handled: the useful question is "what still
 * needs a reply", not "what is the most recent thing that happened". Handled
 * messages are kept rather than deleted — someone will ask what was said.
 */
export default async function AdminMessagesPage() {
  const messages = await db.contactMessage.findMany({
    orderBy: [{ handledAt: "asc" }, { createdAt: "desc" }],
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
        <ul className="mt-6 space-y-4">
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
      )}
    </>
  );
}
