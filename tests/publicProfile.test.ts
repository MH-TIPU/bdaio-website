import { describe, expect, it } from "vitest";
import { toPublicProfile, type ProfileRow } from "@/lib/community/publicProfile";

const NOW = new Date("2026-05-10T12:00:00Z");

function row(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    handle: "rafiul",
    fullName: "Rafiul Hasan Chowdhury",
    fullNameBn: "রাফিউল হাসান চৌধুরী",
    photo: null,
    bio: "I like building small models.",
    presentDistrict: "Dhaka",
    dateOfBirth: new Date("1995-01-01"),
    visibility: "PUBLIC",
    institution: { name: "Dhaka College", slug: "dhaka-college", status: "APPROVED" },
    user: {
      status: "ACTIVE",
      badges: [],
      communityRoles: [],
      memberships: [],
      contributions: [],
      ...overrides.user,
    },
    ...overrides,
  };
}

describe("visibility gate", () => {
  it("returns nothing for a profile that did not opt in", () => {
    expect(toPublicProfile(row({ visibility: "PRIVATE" }), new Map(), NOW)).toBeNull();
  });

  it("returns nothing for a suspended account, even if the profile is public", () => {
    expect(
      toPublicProfile(row({ user: { ...row().user, status: "SUSPENDED" } }), new Map(), NOW),
    ).toBeNull();
  });

  it("returns nothing for a profile with no handle", () => {
    expect(toPublicProfile(row({ handle: null }), new Map(), NOW)).toBeNull();
  });

  it("returns nothing for a missing profile", () => {
    expect(toPublicProfile(null, new Map(), NOW)).toBeNull();
  });

  it("returns a profile for a public, active account", () => {
    expect(toPublicProfile(row(), new Map(), NOW)?.handle).toBe("rafiul");
  });
});

describe("minor redaction (§3.7)", () => {
  const minor = row({ dateOfBirth: new Date("2012-03-04") });

  it("ships a given name only", () => {
    const profile = toPublicProfile(minor, new Map(), NOW)!;
    expect(profile.isMinor).toBe(true);
    expect(profile.displayName).toBe("Rafiul");
    expect(profile.displayName).not.toContain("Hasan");
    expect(profile.displayName).not.toContain("Chowdhury");
  });

  it("withholds the Bengali name, bio and district whatever was filled in", () => {
    const profile = toPublicProfile(minor, new Map(), NOW)!;
    expect(profile.fullNameBn).toBeNull();
    expect(profile.bio).toBeNull();
    expect(profile.district).toBeNull();
  });

  it("carries no date of birth, phone or address in the shape at all", () => {
    const profile = toPublicProfile(minor, new Map(), NOW)!;
    const keys = Object.keys(profile);
    for (const forbidden of ["dateOfBirth", "phone", "address", "presentUpazila", "email"]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("still shows the institution, which is the point of a public profile", () => {
    expect(toPublicProfile(minor, new Map(), NOW)!.institution).toEqual({
      name: "Dhaka College",
      slug: "dhaka-college",
    });
  });

  it("keeps everything for an adult", () => {
    const profile = toPublicProfile(row(), new Map(), NOW)!;
    expect(profile.isMinor).toBe(false);
    expect(profile.displayName).toBe("Rafiul Hasan Chowdhury");
    expect(profile.fullNameBn).toBe("রাফিউল হাসান চৌধুরী");
    expect(profile.bio).toBe("I like building small models.");
    expect(profile.district).toBe("Dhaka");
  });

  it("redacts on the day before the eighteenth birthday and stops on it", () => {
    const turnsEighteenToday = row({ dateOfBirth: new Date("2008-05-10T12:00:00Z") });
    const turnsEighteenTomorrow = row({ dateOfBirth: new Date("2008-05-11T12:00:00Z") });
    expect(toPublicProfile(turnsEighteenToday, new Map(), NOW)!.isMinor).toBe(false);
    expect(toPublicProfile(turnsEighteenTomorrow, new Map(), NOW)!.isMinor).toBe(true);
  });
});

describe("institution and standing", () => {
  it("hides an institution that is not approved", () => {
    const pending = row({
      institution: { name: "Ghost Academy", slug: "ghost", status: "PENDING" },
    });
    expect(toPublicProfile(pending, new Map(), NOW)!.institution).toBeNull();
  });

  it("marks a verified student only when an approved, verified membership exists", () => {
    expect(toPublicProfile(row(), new Map(), NOW)!.verifiedStudent).toBe(false);
    const verified = row({ user: { ...row().user, memberships: [{ id: "m_1" }] } });
    expect(toPublicProfile(verified, new Map(), NOW)!.verifiedStudent).toBe(true);
  });

  it("resolves a scoped role's institution by name, never by id", () => {
    const scoped = row({
      user: {
        ...row().user,
        communityRoles: [{ type: "VOLUNTEER", since: null, institutionId: "inst_9" }],
      },
    });
    const profile = toPublicProfile(scoped, new Map([["inst_9", "Dhaka College"]]), NOW)!;
    expect(profile.roles).toEqual([
      { type: "VOLUNTEER", since: null, institution: "Dhaka College" },
    ]);
    expect(JSON.stringify(profile)).not.toContain("inst_9");
  });

  it("leaves an unresolvable institution null rather than leaking the id", () => {
    const scoped = row({
      user: {
        ...row().user,
        communityRoles: [{ type: "MENTOR", since: null, institutionId: "inst_missing" }],
      },
    });
    const profile = toPublicProfile(scoped, new Map(), NOW)!;
    expect(profile.roles[0].institution).toBeNull();
    expect(JSON.stringify(profile)).not.toContain("inst_missing");
  });
});
