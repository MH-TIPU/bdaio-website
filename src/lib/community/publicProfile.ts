import "server-only";
import { db } from "@/lib/db";
import { avatarUrl } from "@/lib/storage/uploads";
import { isMinorOn } from "@/lib/events/registration";

/**
 * Builds the *only* shape allowed to leave the server for a public profile.
 *
 * Two rules are enforced here rather than in the page, so no future view can
 * forget them:
 *  1. A profile is invisible unless its owner opted in (`visibility: PUBLIC`).
 *  2. **Minors get a reduced profile** — given name and institution only. No
 *     full name, date of birth, phone, address, district, or bio ever ships
 *     for an under-18, regardless of what they filled in.
 */
export type PublicProfile = {
  handle: string;
  displayName: string;
  photoUrl: string | null;
  isMinor: boolean;
  institution: { name: string; slug: string } | null;
  verifiedStudent: boolean;
  // Withheld for minors:
  fullNameBn: string | null;
  bio: string | null;
  district: string | null;
  badges: { id: string; type: string; title: string; awardedAt: Date }[];
  roles: { type: string; since: Date | null; institution: string | null }[];
  contributions: {
    id: string;
    kind: string;
    title: string;
    description: string | null;
    occurredOn: Date | null;
    hours: number | null;
    event: string | null;
  }[];
};

function givenName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export async function getPublicProfile(
  handle: string,
): Promise<PublicProfile | null> {
  const profile = await db.profile.findUnique({
    where: { handle },
    select: {
      handle: true,
      fullName: true,
      fullNameBn: true,
      photo: true,
      bio: true,
      // Only the district is ever exposed — never the upazila or street, which
      // would narrow a participant down to a neighbourhood.
      presentDistrict: true,
      dateOfBirth: true,
      visibility: true,
      institution: { select: { name: true, slug: true, status: true } },
      user: {
        select: {
          id: true,
          status: true,
          badges: {
            orderBy: { awardedAt: "desc" },
            select: { id: true, type: true, title: true, awardedAt: true },
          },
          communityRoles: {
            where: { status: "APPROVED" },
            select: {
              type: true,
              since: true,
              institutionId: true,
            },
          },
          memberships: {
            where: { status: "APPROVED", verified: true },
            select: { id: true },
          },
          contributions: {
            orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
            take: 50,
            select: {
              id: true,
              kind: true,
              title: true,
              description: true,
              occurredOn: true,
              hours: true,
              event: { select: { title: true } },
            },
          },
        },
      },
    },
  });

  if (!profile?.handle) return null;
  // Opt-in only, and suspended accounts disappear from public view.
  if (profile.visibility !== "PUBLIC") return null;
  if (profile.user.status === "SUSPENDED") return null;

  const minor = isMinorOn(profile.dateOfBirth);

  // Resolve institution names for scoped roles without leaking ids.
  const institutionIds = profile.user.communityRoles
    .map((r) => r.institutionId)
    .filter((id): id is string => Boolean(id));
  const institutions = institutionIds.length
    ? await db.institution.findMany({
        where: { id: { in: institutionIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(institutions.map((i) => [i.id, i.name]));

  return {
    handle: profile.handle,
    displayName: minor ? givenName(profile.fullName) : profile.fullName,
    photoUrl: avatarUrl(profile.photo),
    isMinor: minor,
    institution:
      profile.institution && profile.institution.status === "APPROVED"
        ? { name: profile.institution.name, slug: profile.institution.slug }
        : null,
    verifiedStudent: profile.user.memberships.length > 0,
    fullNameBn: minor ? null : profile.fullNameBn,
    bio: minor ? null : profile.bio,
    district: minor ? null : profile.presentDistrict,
    badges: profile.user.badges,
    roles: profile.user.communityRoles.map((r) => ({
      type: r.type,
      since: r.since,
      institution: r.institutionId ? nameById.get(r.institutionId) ?? null : null,
    })),
    contributions: profile.user.contributions.map((c) => ({
      id: c.id,
      kind: c.kind,
      title: c.title,
      description: c.description,
      occurredOn: c.occurredOn,
      hours: c.hours,
      event: c.event?.title ?? null,
    })),
  };
}
