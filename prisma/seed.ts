// Phase 0 seed — minimal, idempotent baseline data so the app has something to render.
// Run with: npm run db:seed   (or `npx prisma db seed`)
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { faqSections } from "../src/data/faq";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Development-only password for the seeded accounts. Override with
// SEED_PASSWORD; never rely on this value in production.
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "BdAIO-dev-2026";
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

async function main() {
  const passwordHash = await hash(SEED_PASSWORD, ARGON);

  // --- A super-admin account you can actually sign in with ---
  const admin = await db.user.upsert({
    where: { email: "admin@bdaio.org" },
    update: { passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" },
    create: {
      email: "admin@bdaio.org",
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          handle: "bdaio-admin",
          fullName: "BdAIO Admin",
          visibility: "PRIVATE",
        },
      },
    },
  });

  // --- A sample institution ---
  // The seed owns these fields: `update` mirrors `create` so re-running after a
  // schema change backfills existing rows instead of leaving them stale.
  const dhakaCollege = {
    name: "Dhaka College",
    type: "COLLEGE" as const,
    division: "Dhaka",
    district: "Dhaka",
    upazila: "Dhaka Metropolitan",
    status: "APPROVED" as const,
    verified: true,
  };
  const institution = await db.institution.upsert({
    where: { slug: "dhaka-college" },
    update: dhakaCollege,
    create: { slug: "dhaka-college", ...dhakaCollege },
  });

  // --- The BdAIO program and its 2026 edition ---
  const bdaio = await db.program.upsert({
    where: { slug: "bdaio" },
    update: {},
    create: {
      title: "Bangladesh Artificial Intelligence Olympiad",
      titleBn: "বাংলাদেশ আর্টিফিশিয়াল ইন্টেলিজেন্স অলিম্পিয়াড",
      slug: "bdaio",
      description:
        "The national AI Olympiad for Bangladeshi students — a pathway to IOAI and IAIO.",
      scope: "NATIONAL",
      isExternal: false,
      active: true,
    },
  });

  // Other programs: a second national olympiad, an external one we only
  // nominate to, and a catch-all home for workshops.
  const winter = await db.program.upsert({
    where: { slug: "winter-ai-olympiad" },
    update: {},
    create: {
      title: "Winter AI Olympiad",
      titleBn: "উইন্টার এআই অলিম্পিয়াড",
      slug: "winter-ai-olympiad",
      description:
        "A shorter, regional winter competition introducing newcomers to AI problem solving.",
      scope: "REGIONAL",
      isExternal: false,
    },
  });

  const apaio = await db.program.upsert({
    where: { slug: "apaio" },
    update: {},
    create: {
      title: "Asia-Pacific AI Olympiad (APAIO)",
      slug: "apaio",
      description:
        "The regional olympiad for the Asia-Pacific. BdAIO nominates the Bangladesh team from national results.",
      scope: "INTERNATIONAL",
      isExternal: true,
    },
  });

  const workshops = await db.program.upsert({
    where: { slug: "bdaio-workshops" },
    update: {},
    create: {
      title: "BdAIO Workshops",
      titleBn: "বিডিএআইও কর্মশালা",
      slug: "bdaio-workshops",
      description:
        "Hands-on workshops, seminars, and short courses that prepare students for the olympiad.",
      scope: "NATIONAL",
      isExternal: false,
    },
  });

  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const events: Prisma.EventCreateInput[] = [
    {
      program: { connect: { id: bdaio.id } },
      title: "BdAIO 2026",
      titleBn: "বিডিএআইও ২০২৬",
      slug: "bdaio-2026",
      type: "OLYMPIAD_EDITION",
      year: 2026,
      description:
        "The 2026 edition of the Bangladesh Artificial Intelligence Olympiad — the national pathway to IOAI and IAIO.",
      mode: "HYBRID",
      status: "OPEN",
      regOpensAt: new Date(now - 7 * day),
      regClosesAt: new Date(now + 30 * day),
      startsAt: new Date(now + 40 * day),
    },
    {
      program: { connect: { id: bdaio.id } },
      title: "BdAIO 2025",
      slug: "bdaio-2025",
      type: "OLYMPIAD_EDITION",
      year: 2025,
      description: "The 2025 edition. Results are published in the archive.",
      mode: "HYBRID",
      status: "ARCHIVED",
    },
    {
      program: { connect: { id: winter.id } },
      title: "Winter AI Olympiad 2026",
      slug: "winter-ai-olympiad-2026",
      type: "REGIONAL_ROUND",
      year: 2026,
      description: "A one-day regional winter competition for beginners.",
      mode: "OFFLINE",
      venue: "Khulna University of Engineering & Technology (KUET)",
      status: "OPEN",
      capacity: 120,
      regOpensAt: new Date(now - 2 * day),
      regClosesAt: new Date(now + 20 * day),
      startsAt: new Date(now + 25 * day),
    },
    {
      program: { connect: { id: apaio.id } },
      title: "APAIO 2026",
      slug: "apaio-2026",
      type: "OLYMPIAD_EDITION",
      year: 2026,
      description:
        "The Asia-Pacific round. The Bangladesh team is nominated from BdAIO national results.",
      mode: "ONLINE",
      status: "RUNNING",
    },
    {
      program: { connect: { id: workshops.id } },
      title: "Intro to Machine Learning — Dhaka",
      titleBn: "মেশিন লার্নিং পরিচিতি — ঢাকা",
      slug: "intro-ml-dhaka-2026",
      type: "WORKSHOP",
      year: 2026,
      description:
        "A hands-on Saturday workshop covering the fundamentals of machine learning with Python. No prior experience needed.",
      mode: "OFFLINE",
      venue: "BDOSN Office, Dhaka",
      capacity: 3, // deliberately small so the waitlist path is exercised
      status: "OPEN",
      regOpensAt: new Date(now - day),
      regClosesAt: new Date(now + 14 * day),
      startsAt: new Date(now + 18 * day),
    },
    {
      program: { connect: { id: workshops.id } },
      title: "Neural Networks Online Seminar",
      slug: "neural-networks-seminar-2026",
      type: "SEMINAR",
      year: 2026,
      description:
        "An evening online seminar on how neural networks learn, with a live Q&A.",
      mode: "ONLINE",
      onlineUrl: "https://meet.example.org/bdaio-nn",
      status: "OPEN",
      regOpensAt: new Date(now - day),
      regClosesAt: new Date(now + 10 * day),
      startsAt: new Date(now + 12 * day),
    },
  ];

  for (const data of events) {
    await db.event.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }

  // Rounds for the current edition, mirroring the published 2026 schedule.
  const edition = await db.event.findUniqueOrThrow({
    where: { slug: "bdaio-2026" },
  });

  const rounds = [
    {
      name: "Dhaka Regional Round",
      order: 1,
      mode: "OFFLINE" as const,
      venue: "Bangladesh University of Business & Technology (BUBT)",
      startsAt: new Date(now + 40 * day),
    },
    {
      name: "Regional / Online Round",
      order: 2,
      mode: "ONLINE" as const,
      venue: "Online (Kaggle Platform)",
      startsAt: new Date(now + 40 * day),
    },
    {
      name: "National Round",
      order: 3,
      mode: "OFFLINE" as const,
      venue: "Dhaka, Bangladesh",
      startsAt: new Date(now + 54 * day),
    },
    {
      name: "Selection Camp & Grooming",
      order: 4,
      mode: "OFFLINE" as const,
      venue: "Residential Camp, Dhaka",
      startsAt: new Date(now + 56 * day),
    },
  ];

  for (const r of rounds) {
    const existing = await db.round.findFirst({
      where: { eventId: edition.id, name: r.name },
    });
    if (existing) {
      await db.round.update({ where: { id: existing.id }, data: r });
    } else {
      await db.round.create({ data: { eventId: edition.id, ...r } });
    }
  }

  // The seed owns this edition's schedule: drop rounds it no longer defines so
  // re-running after a change cannot leave stale entries behind.
  await db.round.deleteMany({
    where: { eventId: edition.id, name: { notIn: rounds.map((r) => r.name) } },
  });

  // --- Sample participants, so the admin views have something to work with ---
  const participants = [
    { email: "rafiul@example.com", name: "Rafiul Hasan", nameBn: "রাফিউল হাসান", dob: "2009-04-12", cls: "Class 10", division: "Dhaka", district: "Dhaka", upazila: "Savar" },
    { email: "nusrat@example.com", name: "Nusrat Jahan", nameBn: "নুসরাত জাহান", dob: "2008-11-03", cls: "Class 11", division: "Khulna", district: "Khulna", upazila: "Dumuria" },
    { email: "tanvir@example.com", name: "Tanvir Ahmed", nameBn: "তানভীর আহমেদ", dob: "2007-06-21", cls: "Class 12", division: "Chattogram", district: "Chattogram", upazila: "Hathazari" },
    { email: "sadia@example.com", name: "Sadia Islam", nameBn: "সাদিয়া ইসলাম", dob: "2010-02-08", cls: "Class 9", division: "Rajshahi", district: "Rajshahi", upazila: "Paba" },
    { email: "imran@example.com", name: "Imran Kabir", nameBn: "ইমরান কবির", dob: "2004-09-30", cls: "1st year", division: "Sylhet", district: "Sylhet", upazila: "Sylhet Sadar" },
  ];

  const created: {
    id: string;
    email: string;
    profileId: string;
    fullName: string;
  }[] = [];

  for (const p of participants) {
    const user = await db.user.upsert({
      where: { email: p.email },
      update: { passwordHash },
      create: {
        email: p.email,
        passwordHash,
        role: "PARTICIPANT",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            fullName: p.name,
            fullNameBn: p.nameBn,
            handle: p.email.split("@")[0],
            dateOfBirth: new Date(p.dob),
            classGrade: p.cls,
            presentDivision: p.division,
            presentDistrict: p.district,
            presentUpazila: p.upazila,
            presentAddress: "House 12, Road 3",
            permanentDivision: p.division,
            permanentDistrict: p.district,
            permanentUpazila: p.upazila,
            permanentAddress: "Village road",
            sameAddress: true,
            institutionId: institution.id,
            visibility: "PRIVATE",
          },
        },
      },
      include: { profile: true },
    });

    // `update` above cannot reach the nested profile, so existing rows would
    // keep stale values after a schema change. Write the seeded fields
    // explicitly to keep this script authoritative.
    if (user.profile) {
      await db.profile.update({
        where: { id: user.profile.id },
        data: {
          fullName: p.name,
          fullNameBn: p.nameBn,
          dateOfBirth: new Date(p.dob),
          classGrade: p.cls,
          presentDivision: p.division,
          presentDistrict: p.district,
          presentUpazila: p.upazila,
          presentAddress: "House 12, Road 3",
          permanentDivision: p.division,
          permanentDistrict: p.district,
          permanentUpazila: p.upazila,
          permanentAddress: "Village road",
          sameAddress: true,
          institutionId: institution.id,
        },
      });
    }
    if (user.profile) {
      created.push({
        id: user.id,
        email: user.email,
        profileId: user.profile.id,
        fullName: user.profile.fullName,
      });

      // Under-18s need a guardian on file to be eligible to register.
      const eighteenth = new Date(p.dob);
      eighteenth.setFullYear(eighteenth.getFullYear() + 18);
      if (eighteenth > new Date()) {
        await db.guardianInfo.upsert({
          where: { profileId: user.profile.id },
          update: {},
          create: {
            profileId: user.profile.id,
            name: `Guardian of ${p.name.split(" ")[0]}`,
            relation: "Parent",
            phone: "+8801700000000",
          },
        });
      }
    }
  }

  // Registrations spanning every status so admin filters are exercised.
  const firstRound = await db.round.findFirstOrThrow({
    where: { eventId: edition.id },
    orderBy: { order: "asc" },
  });
  const workshop = await db.event.findUniqueOrThrow({
    where: { slug: "intro-ml-dhaka-2026" },
  });

  const plan: {
    userIndex: number;
    eventId: string;
    roundId: string | null;
    status: Prisma.RegistrationCreateInput["status"];
  }[] = [
    { userIndex: 0, eventId: edition.id, roundId: firstRound.id, status: "APPROVED" },
    { userIndex: 1, eventId: edition.id, roundId: firstRound.id, status: "APPLIED" },
    { userIndex: 2, eventId: edition.id, roundId: firstRound.id, status: "APPLIED" },
    { userIndex: 3, eventId: edition.id, roundId: firstRound.id, status: "REJECTED" },
    { userIndex: 0, eventId: workshop.id, roundId: null, status: "APPROVED" },
    { userIndex: 1, eventId: workshop.id, roundId: null, status: "APPROVED" },
    { userIndex: 2, eventId: workshop.id, roundId: null, status: "APPROVED" },
    { userIndex: 3, eventId: workshop.id, roundId: null, status: "WAITLISTED" },
    { userIndex: 4, eventId: workshop.id, roundId: null, status: "WITHDRAWN" },
  ];

  for (const entry of plan) {
    const user = created[entry.userIndex];
    if (!user) continue;
    const existing = await db.registration.findFirst({
      where: { userId: user.id, eventId: entry.eventId, roundId: entry.roundId },
    });
    if (existing) {
      await db.registration.update({
        where: { id: existing.id },
        data: { status: entry.status },
      });
    } else {
      await db.registration.create({
        data: {
          userId: user.id,
          eventId: entry.eventId,
          roundId: entry.roundId,
          status: entry.status,
        },
      });
    }
  }

  // --- Community trust layer ---------------------------------------------
  // A second institution that is still awaiting review, so the admin queue and
  // the "pending institutions stay private" rule are both exercised.
  const sylhetClub = {
    name: "Sylhet AI Club",
    nameBn: "সিলেট এআই ক্লাব",
    type: "CLUB" as const,
    division: "Sylhet",
    district: "Sylhet",
    upazila: "Sylhet Sadar",
    description: "A student-run AI club preparing members for the olympiad.",
    status: "PENDING" as const,
    verified: false,
  };
  const pendingClub = await db.institution.upsert({
    where: { slug: "sylhet-ai-club" },
    update: sylhetClub,
    create: { slug: "sylhet-ai-club", ...sylhetClub },
  });

  // Imran (adult, index 4) proposed the pending club → moderator-in-waiting.
  if (created[4]) {
    await db.institutionMembership.upsert({
      where: {
        userId_institutionId: {
          userId: created[4].id,
          institutionId: pendingClub.id,
        },
      },
      update: {},
      create: {
        userId: created[4].id,
        institutionId: pendingClub.id,
        membershipRole: "MODERATOR",
        status: "PENDING",
      },
    });
  }

  // Dhaka College is approved: give it a moderator plus members in each state.
  const memberships: {
    idx: number;
    role: "MODERATOR" | "STUDENT" | "VOLUNTEER";
    status: "PENDING" | "APPROVED";
    verified: boolean;
    note?: string;
  }[] = [
    { idx: 2, role: "MODERATOR", status: "APPROVED", verified: false },
    { idx: 0, role: "STUDENT", status: "APPROVED", verified: true, note: "Class 10, roll 42" },
    { idx: 1, role: "STUDENT", status: "APPROVED", verified: false, note: "Class 11, science" },
    { idx: 3, role: "STUDENT", status: "PENDING", verified: false, note: "Please confirm — Class 9" },
  ];

  for (const m of memberships) {
    const person = created[m.idx];
    if (!person) continue;
    await db.institutionMembership.upsert({
      where: {
        userId_institutionId: {
          userId: person.id,
          institutionId: institution.id,
        },
      },
      update: {
        membershipRole: m.role,
        status: m.status,
        verified: m.verified,
        verifiedById: m.verified ? created[2]?.id ?? null : null,
        verifiedAt: m.verified ? new Date() : null,
      },
      create: {
        userId: person.id,
        institutionId: institution.id,
        membershipRole: m.role,
        status: m.status,
        verified: m.verified,
        verifiedById: m.verified ? created[2]?.id ?? null : null,
        verifiedAt: m.verified ? new Date() : null,
        note: m.note ?? null,
      },
    });
  }

  // The moderator's account role must match their responsibility.
  if (created[2]) {
    await db.user.update({
      where: { id: created[2].id },
      data: { role: "INSTITUTION_MODERATOR" },
    });
  }

  // Community roles: one approved global mentor, one pending global volunteer.
  const roleSeeds: {
    idx: number;
    type: "VOLUNTEER" | "MENTOR" | "CONTRIBUTOR";
    status: "PENDING" | "APPROVED";
  }[] = [
    { idx: 4, type: "MENTOR", status: "APPROVED" },
    { idx: 0, type: "CONTRIBUTOR", status: "APPROVED" },
    { idx: 1, type: "VOLUNTEER", status: "PENDING" },
  ];

  for (const r of roleSeeds) {
    const person = created[r.idx];
    if (!person) continue;
    const existing = await db.communityRole.findFirst({
      where: { userId: person.id, type: r.type, institutionId: null },
    });
    if (existing) {
      await db.communityRole.update({
        where: { id: existing.id },
        data: { status: r.status, since: r.status === "APPROVED" ? new Date() : null },
      });
    } else {
      await db.communityRole.create({
        data: {
          userId: person.id,
          type: r.type,
          institutionId: null,
          status: r.status,
          since: r.status === "APPROVED" ? new Date() : null,
          motivation:
            "I would like to help more students in Bangladesh get started with AI.",
        },
      });
    }
  }

  // Badges mirror the granted state (normally awarded by the server actions).
  const badgeSeeds: { idx: number; type: "VERIFIED_STUDENT" | "MENTOR" | "CONTRIBUTOR" }[] = [
    { idx: 0, type: "VERIFIED_STUDENT" },
    { idx: 0, type: "CONTRIBUTOR" },
    { idx: 4, type: "MENTOR" },
  ];
  const badgeTitles = {
    VERIFIED_STUDENT: "Verified Student",
    MENTOR: "Mentor",
    CONTRIBUTOR: "Contributor",
  } as const;

  for (const b of badgeSeeds) {
    const person = created[b.idx];
    if (!person) continue;
    const existing = await db.badge.findFirst({
      where: { userId: person.id, type: b.type, eventId: null },
    });
    if (!existing) {
      await db.badge.create({
        data: { userId: person.id, type: b.type, title: badgeTitles[b.type] },
      });
    }
  }

  // Contributions for the recognised people, so a public profile has substance.
  const contributionSeeds: {
    idx: number;
    kind: "ORGANIZING" | "MENTORING" | "CONTENT" | "TRANSLATION";
    title: string;
    hours?: number;
  }[] = [
    { idx: 4, kind: "MENTORING", title: "Mentored 12 students for the preliminary round", hours: 24 },
    { idx: 4, kind: "ORGANIZING", title: "Coordinated the Dhaka regional venue", hours: 8 },
    { idx: 0, kind: "TRANSLATION", title: "Translated the syllabus into Bangla", hours: 10 },
    { idx: 0, kind: "CONTENT", title: "Wrote three practice problems on decision trees" },
  ];

  for (const c of contributionSeeds) {
    const person = created[c.idx];
    if (!person) continue;
    const existing = await db.contribution.findFirst({
      where: { userId: person.id, title: c.title },
    });
    if (!existing) {
      await db.contribution.create({
        data: {
          userId: person.id,
          kind: c.kind,
          title: c.title,
          hours: c.hours ?? null,
          occurredOn: new Date(now - 30 * day),
        },
      });
    }
  }

  // Make two profiles public so /u/[handle] can be seen: one adult, one minor
  // (the minor's page must show only reduced information).
  for (const idx of [0, 4]) {
    const person = created[idx];
    if (!person) continue;
    await db.profile.update({
      where: { id: person.profileId },
      data: { visibility: "PUBLIC" },
    });
  }

  // --- Journey: resources, certificates, notifications --------------------
  const categories = [
    { name: "Syllabus & rules", slug: "syllabus-rules", order: 1 },
    { name: "Past problems", slug: "past-problems", order: 2 },
    { name: "Learning materials", slug: "learning-materials", order: 3 },
  ];
  for (const c of categories) {
    await db.resourceCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, order: c.order },
      create: c,
    });
  }

  const catId = async (slug: string) =>
    (await db.resourceCategory.findUniqueOrThrow({ where: { slug } })).id;

  const resources: {
    title: string;
    titleBn?: string;
    kind: "SYLLABUS" | "GUIDELINE" | "PAST_PROBLEM" | "MATERIAL" | "LINK";
    visibility: "PUBLIC" | "MEMBERS";
    url: string;
    category: string;
    description?: string;
  }[] = [
    {
      title: "BdAIO 2026 Syllabus",
      titleBn: "বিডিএআইও ২০২৬ সিলেবাস",
      kind: "SYLLABUS",
      visibility: "PUBLIC",
      url: "/syllabus",
      category: "syllabus-rules",
      description: "Everything the 2026 rounds can examine.",
    },
    {
      title: "Participation Guideline",
      kind: "GUIDELINE",
      visibility: "PUBLIC",
      url: "/participation-guideline",
      category: "syllabus-rules",
    },
    {
      title: "BdAIO 2024 Preliminary — questions",
      kind: "PAST_PROBLEM",
      visibility: "PUBLIC",
      url: "/media/2025/03/BdAIO-2024-Preli-pdf.jpg",
      category: "past-problems",
      description: "The 2024 preliminary paper.",
    },
    {
      title: "National Round 2025 — solutions & marking notes",
      kind: "PAST_PROBLEM",
      visibility: "MEMBERS",
      url: "/resources/national-2025-solutions",
      category: "past-problems",
      description: "Worked solutions. Available to signed-in members.",
    },
    {
      title: "Intro to Python for AI — workbook",
      titleBn: "এআই-এর জন্য পাইথন পরিচিতি",
      kind: "MATERIAL",
      visibility: "MEMBERS",
      url: "/resources/python-workbook",
      category: "learning-materials",
      description: "Self-paced workbook used in our workshops.",
    },
    {
      title: "Kaggle — practice competitions",
      kind: "LINK",
      visibility: "PUBLIC",
      url: "https://www.kaggle.com/competitions",
      category: "learning-materials",
    },
  ];

  for (const r of resources) {
    const existing = await db.resource.findFirst({ where: { title: r.title } });
    const data = {
      title: r.title,
      titleBn: r.titleBn ?? null,
      description: r.description ?? null,
      kind: r.kind,
      visibility: r.visibility,
      url: r.url,
      categoryId: await catId(r.category),
      published: true,
    };
    if (existing) {
      await db.resource.update({ where: { id: existing.id }, data });
    } else {
      await db.resource.create({ data });
    }
  }

  // Certificates for the two participants approved on the archived 2025 edition.
  const archived = await db.event.findUnique({ where: { slug: "bdaio-2025" } });
  if (archived) {
    for (const idx of [0, 1]) {
      const person = created[idx];
      if (!person) continue;

      // Ensure there is an approved registration to certify.
      const existingReg = await db.registration.findFirst({
        where: { userId: person.id, eventId: archived.id },
      });
      if (!existingReg) {
        await db.registration.create({
          data: { userId: person.id, eventId: archived.id, status: "APPROVED" },
        });
      }

      const existingCert = await db.certificate.findFirst({
        where: { userId: person.id, eventId: archived.id },
      });
      if (!existingCert) {
        await db.certificate.create({
          data: {
            serial: `BDAIO-2025-SEED${idx}${idx}${idx}${idx}`,
            userId: person.id,
            eventId: archived.id,
            type: idx === 0 ? "MEDAL" : "PARTICIPATION",
            title:
              idx === 0
                ? "Certificate of Achievement"
                : "Certificate of Participation",
            recipientName: person.fullName,
            detail: idx === 0 ? "Bronze Medal, National Round" : null,
          },
        });
      }
    }
  }

  // A couple of unread notifications so the centre is not empty.
  if (created[0]) {
    const existing = await db.notification.count({ where: { userId: created[0].id } });
    if (existing === 0) {
      await db.notification.createMany({
        data: [
          {
            userId: created[0].id,
            type: "certificate.issued",
            title: "Your certificate is ready",
            body: "BdAIO 2025 — download it from your dashboard.",
            href: "/dashboard/certificates",
          },
          {
            userId: created[0].id,
            type: "membership.verified",
            title: "You are now a verified student",
            body: "Dhaka College confirmed your membership.",
            href: "/dashboard/achievements",
          },
        ],
      });
    }
  }

  // --- Results: one published round, one draft, plus a judge ---------------
  const nationalRound = await db.round.findFirst({
    where: { event: { slug: "bdaio-2026" }, name: "National Round" },
  });
  const prelimRound = await db.round.findFirst({
    where: { event: { slug: "bdaio-2026" }, name: "Dhaka Regional Round" },
  });

  if (nationalRound && prelimRound) {
    // Approve the 2026 entrants so there is something to score.
    await db.registration.updateMany({
      where: { eventId: nationalRound.eventId, status: "APPLIED" },
      data: { status: "APPROVED" },
    });

    const approved = await db.registration.findMany({
      where: { eventId: nationalRound.eventId, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
    });

    // PUBLISHED round: marks + medals, visible to participants and the public.
    const marks = [92, 85, 78, 61];
    const medals = ["GOLD", "SILVER", "BRONZE", null] as const;
    for (const [i, registration] of approved.slice(0, 4).entries()) {
      await db.result.upsert({
        where: {
          registrationId_roundId: {
            registrationId: registration.id,
            roundId: nationalRound.id,
          },
        },
        update: {
          marks: marks[i],
          maxMarks: 100,
          rank: i + 1,
          medal: medals[i],
          published: true,
          publishedAt: new Date(),
        },
        create: {
          registrationId: registration.id,
          roundId: nationalRound.id,
          marks: marks[i],
          maxMarks: 100,
          rank: i + 1,
          medal: medals[i],
          published: true,
          publishedAt: new Date(),
        },
      });
    }

    // DRAFT round: scored but NOT published — must stay hidden everywhere.
    for (const [i, registration] of approved.slice(0, 3).entries()) {
      await db.result.upsert({
        where: {
          registrationId_roundId: {
            registrationId: registration.id,
            roundId: prelimRound.id,
          },
        },
        update: { marks: 70 - i * 5, maxMarks: 100, rank: i + 1, published: false },
        create: {
          registrationId: registration.id,
          roundId: prelimRound.id,
          marks: 70 - i * 5,
          maxMarks: 100,
          rank: i + 1,
          published: false,
        },
      });
    }

    // Imran (the mentor) judges the preliminary round only.
    if (created[4]) {
      await db.roundJudge.upsert({
        where: { roundId_userId: { roundId: prelimRound.id, userId: created[4].id } },
        update: {},
        create: { roundId: prelimRound.id, userId: created[4].id },
      });
    }
  }

  // --- CMS: migrate the static Bengali FAQ into editable rows -------------
  // src/data/faq.ts stays as the source of the initial content; once seeded,
  // admins edit the DB copy and the public page reads only from the DB.
  let faqOrder = 0;
  for (const section of faqSections) {
    for (const item of section.items) {
      faqOrder += 1;
      const existing = await db.faqItem.findFirst({
        where: { question: item.question },
      });
      const data = {
        section: section.title,
        question: item.question,
        answer: item.answer,
        order: faqOrder,
        published: true,
      };
      if (existing) {
        await db.faqItem.update({ where: { id: existing.id }, data });
      } else {
        await db.faqItem.create({ data });
      }
    }
  }

  // A sample editable page and a live announcement.
  await db.page.upsert({
    where: { slug: "code-of-conduct" },
    update: {},
    create: {
      slug: "code-of-conduct",
      title: "Code of Conduct",
      titleBn: "আচরণবিধি",
      body: "BdAIO is open to every student in Bangladesh, and everyone taking part is expected to behave with respect and integrity.\n\nCheating, plagiarism, or sharing answers during a round leads to disqualification. Harassment of any kind is not tolerated, online or in person.\n\nIf something goes wrong, contact the organisers — we would rather hear about a problem early.",
      published: true,
    },
  });

  const notice = await db.announcement.findFirst({
    where: { title: "BdAIO 2026 registration is open" },
  });
  if (!notice) {
    await db.announcement.create({
      data: {
        title: "BdAIO 2026 registration is open",
        titleBn: "বিডিএআইও ২০২৬ নিবন্ধন শুরু",
        body: "Registration for the 2026 edition is now open to students up to Grade 12. Complete your profile, then register for the round nearest you.\n\nThe Dhaka regional round and the nationwide online round both run next month.",
        bodyBn: "২০২৬ সালের আসরে দ্বাদশ শ্রেণি পর্যন্ত শিক্ষার্থীদের নিবন্ধন শুরু হয়েছে।",
        audience: "EVERYONE",
        pinned: true,
        published: true,
      },
    });
  }

  // A members-only notice, to prove audience filtering.
  const memberNotice = await db.announcement.findFirst({
    where: { title: "Practice problem set for members" },
  });
  if (!memberNotice) {
    await db.announcement.create({
      data: {
        title: "Practice problem set for members",
        body: "A new set of practice problems is available in the resource library for signed-in members.",
        audience: "MEMBERS",
        published: true,
      },
    });
  }

  console.log("Seed complete:", {
    admin: admin.email,
    participants: created.length,
    registrations: plan.length,
    institution: institution.slug,
    programs: [bdaio.slug, winter.slug, apaio.slug, workshops.slug],
    events: events.length,
    rounds: rounds.length,
    password: SEED_PASSWORD,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
