import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hasDatabase } from "./setup";
import {
  expectRedirect,
  form,
  makeInstitution,
  makeMembership,
  makeUser,
  resetDb,
  signIn,
  signOut,
} from "./helpers";
import { db } from "@/lib/db";
import {
  decideInstitution,
  decideMembership,
  setMembershipVerified,
} from "@/server/community/actions";

/**
 * The trust chain (§3.7), exercised against a real database.
 *
 * The credibility of a "Verified Student" badge is the whole point of the
 * platform, so these are the rules worth holding down: who may approve what,
 * what approval installs, what rejection withdraws, and what the audit trail is
 * allowed to say afterwards.
 */
describe.skipIf(!hasDatabase)("trust chain", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await db.$disconnect();
  });

  describe("institution approval is what installs moderators", () => {
    it("leaves a proposed institution invisible and its moderator powerless", async () => {
      const pending = await makeInstitution({ status: "PENDING" });
      const proposer = await makeUser();
      await makeMembership({
        userId: proposer.id,
        institutionId: pending.id,
        membershipRole: "MODERATOR",
        status: "PENDING",
      });

      const membership = await db.institutionMembership.findFirstOrThrow({
        where: { userId: proposer.id },
      });
      expect(membership.status).toBe("PENDING");

      const account = await db.user.findUniqueOrThrow({ where: { id: proposer.id } });
      expect(account.role).toBe("PARTICIPANT");
    });

    it("promotes pending moderators only when an admin approves", async () => {
      const institution = await makeInstitution({ status: "PENDING" });
      const proposer = await makeUser();
      await makeMembership({
        userId: proposer.id,
        institutionId: institution.id,
        membershipRole: "MODERATOR",
        status: "PENDING",
      });

      const admin = await makeUser({ role: "ADMIN" });
      await signIn(admin.id);
      await decideInstitution(
        form({ institutionId: institution.id, decision: "APPROVED" }),
      );

      const after = await db.institution.findUniqueOrThrow({ where: { id: institution.id } });
      expect(after.status).toBe("APPROVED");
      expect(after.verified).toBe(true);

      const membership = await db.institutionMembership.findFirstOrThrow({
        where: { userId: proposer.id },
      });
      expect(membership.status).toBe("APPROVED");

      const account = await db.user.findUniqueOrThrow({ where: { id: proposer.id } });
      expect(account.role).toBe("INSTITUTION_MODERATOR");
    });

    it("never demotes an admin who happens to be a moderator", async () => {
      const institution = await makeInstitution({ status: "PENDING" });
      const superuser = await makeUser({ role: "SUPER_ADMIN" });
      await makeMembership({
        userId: superuser.id,
        institutionId: institution.id,
        membershipRole: "MODERATOR",
        status: "PENDING",
      });

      const admin = await makeUser({ role: "ADMIN" });
      await signIn(admin.id);
      await decideInstitution(
        form({ institutionId: institution.id, decision: "APPROVED" }),
      );

      const account = await db.user.findUniqueOrThrow({ where: { id: superuser.id } });
      expect(account.role).toBe("SUPER_ADMIN");
    });

    it("refuses a participant, and changes nothing", async () => {
      const institution = await makeInstitution({ status: "PENDING" });
      const nobody = await makeUser();
      await signIn(nobody.id);

      const to = await expectRedirect(() =>
        decideInstitution(form({ institutionId: institution.id, decision: "APPROVED" })),
      );
      expect(to).toBe("/dashboard");

      const after = await db.institution.findUniqueOrThrow({ where: { id: institution.id } });
      expect(after.status).toBe("PENDING");
      expect(after.verified).toBe(false);
    });

    it("sends a signed-out caller to the login page", async () => {
      const institution = await makeInstitution({ status: "PENDING" });
      signOut();

      const to = await expectRedirect(() =>
        decideInstitution(form({ institutionId: institution.id, decision: "APPROVED" })),
      );
      expect(to).toBe("/login");

      const after = await db.institution.findUniqueOrThrow({ where: { id: institution.id } });
      expect(after.status).toBe("PENDING");
    });
  });

  describe("membership decisions are scoped to one institution", () => {
    it("lets this institution's moderator approve", async () => {
      const institution = await makeInstitution();
      const moderator = await makeUser({ role: "INSTITUTION_MODERATOR" });
      await makeMembership({
        userId: moderator.id,
        institutionId: institution.id,
        membershipRole: "MODERATOR",
      });
      await db.profile.update({
        where: { userId: moderator.id },
        data: { institutionId: institution.id },
      });

      const student = await makeUser();
      const membership = await makeMembership({
        userId: student.id,
        institutionId: institution.id,
        status: "PENDING",
      });

      await signIn(moderator.id);
      await decideMembership(form({ membershipId: membership.id, decision: "APPROVED" }));

      const after = await db.institutionMembership.findUniqueOrThrow({
        where: { id: membership.id },
      });
      expect(after.status).toBe("APPROVED");
    });

    it("refuses a moderator of a different institution", async () => {
      const theirs = await makeInstitution();
      const ours = await makeInstitution();

      const outsider = await makeUser({ role: "INSTITUTION_MODERATOR" });
      await db.profile.update({
        where: { userId: outsider.id },
        data: { institutionId: theirs.id },
      });

      const student = await makeUser();
      const membership = await makeMembership({
        userId: student.id,
        institutionId: ours.id,
        status: "PENDING",
      });

      await signIn(outsider.id);
      const to = await expectRedirect(() =>
        decideMembership(form({ membershipId: membership.id, decision: "APPROVED" })),
      );
      expect(to).toBe("/dashboard");

      const after = await db.institutionMembership.findUniqueOrThrow({
        where: { id: membership.id },
      });
      expect(after.status).toBe("PENDING");
    });

    it("lets an admin act at any institution", async () => {
      const institution = await makeInstitution();
      const student = await makeUser();
      const membership = await makeMembership({
        userId: student.id,
        institutionId: institution.id,
        status: "PENDING",
      });

      const admin = await makeUser({ role: "ADMIN" });
      await signIn(admin.id);
      await decideMembership(form({ membershipId: membership.id, decision: "APPROVED" }));

      const after = await db.institutionMembership.findUniqueOrThrow({
        where: { id: membership.id },
      });
      expect(after.status).toBe("APPROVED");
    });
  });

  describe("verification grants the badge, and only a moderator can grant it", () => {
    async function scenario() {
      const institution = await makeInstitution();
      const moderator = await makeUser({ role: "INSTITUTION_MODERATOR" });
      await makeMembership({
        userId: moderator.id,
        institutionId: institution.id,
        membershipRole: "MODERATOR",
      });
      await db.profile.update({
        where: { userId: moderator.id },
        data: { institutionId: institution.id },
      });

      const student = await makeUser();
      const membership = await makeMembership({
        userId: student.id,
        institutionId: institution.id,
        status: "APPROVED",
      });
      return { institution, moderator, student, membership };
    }

    it("grants a Verified Student badge on verification", async () => {
      const { moderator, student, membership } = await scenario();

      await signIn(moderator.id);
      await setMembershipVerified(form({ membershipId: membership.id, verified: "1" }));

      const after = await db.institutionMembership.findUniqueOrThrow({
        where: { id: membership.id },
      });
      expect(after.verified).toBe(true);
      expect(after.verifiedById).toBe(moderator.id);

      const badges = await db.badge.findMany({ where: { userId: student.id } });
      expect(badges.map((b) => b.type)).toEqual(["VERIFIED_STUDENT"]);
    });

    it("does not double-grant when verified twice", async () => {
      const { moderator, student, membership } = await scenario();
      await signIn(moderator.id);
      await setMembershipVerified(form({ membershipId: membership.id, verified: "1" }));
      await setMembershipVerified(form({ membershipId: membership.id, verified: "1" }));

      expect(await db.badge.count({ where: { userId: student.id } })).toBe(1);
    });

    it("revokes the badge when verification is withdrawn", async () => {
      const { moderator, student, membership } = await scenario();
      await signIn(moderator.id);
      await setMembershipVerified(form({ membershipId: membership.id, verified: "1" }));
      await setMembershipVerified(form({ membershipId: membership.id, verified: "0" }));

      const after = await db.institutionMembership.findUniqueOrThrow({
        where: { id: membership.id },
      });
      expect(after.verified).toBe(false);
      expect(after.verifiedById).toBeNull();
      expect(await db.badge.count({ where: { userId: student.id } })).toBe(0);
    });

    it("revokes the badge when the membership is later rejected", async () => {
      const { moderator, student, membership } = await scenario();
      await signIn(moderator.id);
      await setMembershipVerified(form({ membershipId: membership.id, verified: "1" }));
      expect(await db.badge.count({ where: { userId: student.id } })).toBe(1);

      await decideMembership(form({ membershipId: membership.id, decision: "REJECTED" }));

      const after = await db.institutionMembership.findUniqueOrThrow({
        where: { id: membership.id },
      });
      expect(after.status).toBe("REJECTED");
      expect(after.verified).toBe(false);
      expect(await db.badge.count({ where: { userId: student.id } })).toBe(0);
    });

    it("refuses to verify a membership that is not approved", async () => {
      const institution = await makeInstitution();
      const moderator = await makeUser({ role: "INSTITUTION_MODERATOR" });
      await db.profile.update({
        where: { userId: moderator.id },
        data: { institutionId: institution.id },
      });
      const student = await makeUser();
      const pending = await makeMembership({
        userId: student.id,
        institutionId: institution.id,
        status: "PENDING",
      });

      await signIn(moderator.id);
      await setMembershipVerified(form({ membershipId: pending.id, verified: "1" }));

      const after = await db.institutionMembership.findUniqueOrThrow({
        where: { id: pending.id },
      });
      expect(after.verified).toBe(false);
      expect(await db.badge.count({ where: { userId: student.id } })).toBe(0);
    });

    it("stops a moderator verifying their own membership", async () => {
      const institution = await makeInstitution();
      const moderator = await makeUser({ role: "INSTITUTION_MODERATOR" });
      await db.profile.update({
        where: { userId: moderator.id },
        data: { institutionId: institution.id },
      });
      // Their own student membership at the institution they moderate.
      const own = await makeMembership({
        userId: moderator.id,
        institutionId: institution.id,
        status: "APPROVED",
      });

      await signIn(moderator.id);
      await setMembershipVerified(form({ membershipId: own.id, verified: "1" }));

      const after = await db.institutionMembership.findUniqueOrThrow({ where: { id: own.id } });
      expect(after.verified).toBe(false);
      expect(await db.badge.count({ where: { userId: moderator.id } })).toBe(0);
    });

    it("refuses a moderator from another institution, and grants no badge", async () => {
      const { student, membership } = await scenario();
      const elsewhere = await makeInstitution();
      const outsider = await makeUser({ role: "INSTITUTION_MODERATOR" });
      await db.profile.update({
        where: { userId: outsider.id },
        data: { institutionId: elsewhere.id },
      });

      await signIn(outsider.id);
      const to = await expectRedirect(() =>
        setMembershipVerified(form({ membershipId: membership.id, verified: "1" })),
      );
      expect(to).toBe("/dashboard");
      expect(await db.badge.count({ where: { userId: student.id } })).toBe(0);
    });
  });

  describe("the audit trail records what happened, and only that", () => {
    it("writes an entry for a decision that went through", async () => {
      const institution = await makeInstitution({ status: "PENDING" });
      const admin = await makeUser({ role: "ADMIN" });
      await signIn(admin.id);
      await decideInstitution(
        form({ institutionId: institution.id, decision: "APPROVED" }),
      );

      const logs = await db.activityLog.findMany({
        where: { entityType: "Institution", entityId: institution.id },
      });
      expect(logs.map((l) => l.action)).toEqual(["admin.institution.approved"]);
      expect(logs[0].userId).toBe(admin.id);
    });

    it("writes nothing when the attempt was refused", async () => {
      const institution = await makeInstitution({ status: "PENDING" });
      const nobody = await makeUser();
      await signIn(nobody.id);

      await expectRedirect(() =>
        decideInstitution(form({ institutionId: institution.id, decision: "APPROVED" })),
      );

      // Not "no entry for this institution" — no trust entry at all. A refused
      // attempt must not leave anything that reads like an action.
      const logs = await db.activityLog.findMany({
        where: { entityType: { in: ["Institution", "InstitutionMembership"] } },
      });
      expect(logs).toEqual([]);
    });

    it("writes nothing when a moderator is refused at another institution", async () => {
      const ours = await makeInstitution();
      const theirs = await makeInstitution();
      const outsider = await makeUser({ role: "INSTITUTION_MODERATOR" });
      await db.profile.update({
        where: { userId: outsider.id },
        data: { institutionId: theirs.id },
      });
      const student = await makeUser();
      const membership = await makeMembership({
        userId: student.id,
        institutionId: ours.id,
        status: "PENDING",
      });

      await signIn(outsider.id);
      await expectRedirect(() =>
        decideMembership(form({ membershipId: membership.id, decision: "APPROVED" })),
      );

      expect(
        await db.activityLog.count({ where: { entityType: "InstitutionMembership" } }),
      ).toBe(0);
    });
  });
});
