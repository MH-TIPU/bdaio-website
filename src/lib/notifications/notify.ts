import "server-only";
import { db } from "@/lib/db";
import { oneSegment, sendSms } from "@/lib/sms/sender";

/**
 * Creates an in-app notification. Never throws into the calling flow — a
 * failed notification must not roll back the action it was reporting.
 *
 * Pass `sms` to also text the user. Three conditions all have to hold, and they
 * are checked here rather than at the call sites so no future caller can skip
 * one: the user opted in, they have a usable Bangladeshi mobile number, and a
 * gateway is configured. SMS costs money per message and arrives whether or not
 * it is wanted, so it is never the default — see §3.12.
 */
export async function notify(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
  /** Optional SMS text. Reserve it for things a participant must not miss. */
  sms?: string;
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to create notification", error);
  }

  if (input.sms) await maybeSendSms(input.userId, input.sms);
}

async function maybeSendSms(userId: string, text: string): Promise<void> {
  try {
    const profile = await db.profile.findUnique({
      where: { userId },
      select: { phone: true, smsOptIn: true },
    });
    if (!profile?.smsOptIn || !profile.phone) return;

    // oneSegment here, not at the call site: it is a billing guard, and a guard
    // every caller has to remember is a guard that eventually gets forgotten.
    await sendSms({ to: profile.phone, text: oneSegment(text) });
  } catch (error) {
    console.error("Failed to send notification SMS", error);
  }
}

export async function unreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}
