import "server-only";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/dal";

/**
 * Announcements the given viewer may see.
 *
 * Audience and scheduling are enforced in the *query*, so a restricted or
 * not-yet-published notice never reaches the client at all.
 */
export async function visibleAnnouncements(user: CurrentUser | null, take = 20) {
  const now = new Date();

  const audiences: ("EVERYONE" | "MEMBERS" | "MODERATORS")[] = ["EVERYONE"];
  if (user) audiences.push("MEMBERS");
  if (
    user &&
    (user.role === "INSTITUTION_MODERATOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN")
  ) {
    audiences.push("MODERATORS");
  }

  return db.announcement.findMany({
    where: {
      published: true,
      audience: { in: audiences },
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }, { createdAt: "desc" }],
    take,
  });
}
