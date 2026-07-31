import "server-only";
import { db } from "@/lib/db";
import type { BadgeType, CommunityRoleType } from "@/generated/prisma/enums";

// Badges are granted here and nowhere else. Every path into this module runs
// server-side after an authorization check, so a badge can never be
// self-awarded — that is the whole point of the trust layer.

const ROLE_BADGE: Record<CommunityRoleType, BadgeType> = {
  VOLUNTEER: "VOLUNTEER",
  MENTOR: "MENTOR",
  CONTRIBUTOR: "CONTRIBUTOR",
};

const TITLES: Record<BadgeType, string> = {
  VERIFIED_STUDENT: "Verified Student",
  VOLUNTEER: "Volunteer",
  MENTOR: "Mentor",
  CONTRIBUTOR: "Contributor",
  MEDAL: "Medalist",
  PARTICIPATION: "Participant",
};

export function roleBadgeType(role: CommunityRoleType): BadgeType {
  return ROLE_BADGE[role];
}

export function badgeTitle(type: BadgeType): string {
  return TITLES[type];
}

export async function grantBadge(
  userId: string,
  type: BadgeType,
  eventId: string | null = null,
): Promise<void> {
  const existing = await db.badge.findFirst({
    where: { userId, type, eventId },
    select: { id: true },
  });
  if (existing) return;

  await db.badge.create({
    data: { userId, type, title: TITLES[type], eventId },
  });
}

/** Badges are revocable — verification and community standing can be withdrawn. */
export async function revokeBadge(
  userId: string,
  type: BadgeType,
  eventId: string | null = null,
): Promise<void> {
  await db.badge.deleteMany({ where: { userId, type, eventId } });
}
