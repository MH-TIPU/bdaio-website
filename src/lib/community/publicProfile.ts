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

/**
 * The row this builds from, named so the redaction can be tested without a
 * database. The query below must select exactly this.
 */
export type ProfileRow = {
  handle: string | null;
  fullName: string;
  fullNameBn: string | null;
  photo: string | null;
  bio: string | null;
  presentDistrict: string | null;
  dateOfBirth: Date | null;
  visibility: string;
  institution: { name: string; slug: string; status: string } | null;
  user: {
    status: string;
    badges: { id: string; type: string; title: string; awardedAt: Date }[];
    communityRoles: { type: string; since: Date | null; institutionId: string | null }[];
    memberships: { id: string }[];
    contributions: {
      id: string;
      kind: string;
      title: string;
      description: string | null;
      occurredOn: Date | null;
      hours: number | null;
      event: { title: string } | null;
    }[];
  };
};

/**
 * Row → the shape allowed off the server, including the visibility gate and the
 * minor redaction.
 *
 * Pure and separate from the query on purpose: these two rules are the ones a
 * mistake would be worst in, and this is what lets a test state them directly
 * instead of asserting on a fixture in a database.
 */
export function toPublicProfile(
  profile: ProfileRow | null,
  institutionNameById: Map<string, string> = new Map(),
  now: Date = new Date(),
): PublicProfile | null {
  if (!profile?.handle) return null;
  // Opt-in only, and suspended accounts disappear from public view.
  if (profile.visibility !== "PUBLIC") return null;
  if (profile.user.status === "SUSPENDED") return null;

  const minor = isMinorOn(profile.dateOfBirth, now);

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
      institution: r.institutionId
        ? institutionNameById.get(r.institutionId) ?? null
        : null,
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

  // The gate is applied twice — here so a private profile costs one query
  // instead of two, and again in `toPublicProfile`, which is where it is stated.
  if (!profile?.handle) return null;
  if (profile.visibility !== "PUBLIC") return null;
  if (profile.user.status === "SUSPENDED") return null;

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

  return toPublicProfile(profile, nameById);
}
