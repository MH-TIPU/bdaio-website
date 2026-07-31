import "server-only";
import { db } from "@/lib/db";

/**
 * Creates an in-app notification. Never throws into the calling flow — a
 * failed notification must not roll back the action it was reporting.
 */
export async function notify(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
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
}

export async function unreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}
