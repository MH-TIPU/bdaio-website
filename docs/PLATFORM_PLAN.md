# BdAIO Platform — Engineering Plan (CTO)

> My build plan for turning the BdAIO site from a static brochure into a **self‑sufficient olympiad platform**:
> accounts, profiles, multi‑program competitions, workshops, institutions/clubs, a volunteer/mentor/contributor
> community, public profiles, achievements, results, resources, admin back‑office, and (later) payments + an LMS.
>
> This is written for **me, the implementer** — decisions are made, not offered. Where a call is really the
> team's (pricing, policy), I state the **default I'm building to** and flag it; override anytime and I adjust.
>
> **Status:** Plan locked, code not started. **Owner:** Engineering (CTO). **Updated:** 2026‑07‑31.

---

## 0. How I'll operate

- **Ship in vertical slices.** Every phase is deployable and demoable on its own. No big‑bang rewrite.
- **AGENTS.md is law.** This repo runs a Next.js with breaking changes. **Before writing any code for a task I
  read the relevant guide in `node_modules/next/dist/docs/`** and heed deprecations. Any library (auth, ORM,
  PDF) is verified against **Next 16.2.9** before I commit to it.
- **Server‑first.** Prefer Server Components + Server Actions; add route handlers/APIs only where needed
  (webhooks, uploads, third‑party callbacks).
- **Type‑safe end to end.** One Zod schema per input drives the form, the server action, and the DB write.
- **Nothing is trusted from the client.** RBAC + validation enforced server‑side on every mutation.
- **Bilingual by default (EN/বাংলা).** No feature ships English‑only.
- **I don't commit/deploy without being asked** (per standing instruction). Migrations and secrets never land in git.

---

## 1. Mandate

Grow BdAIO into a platform that (a) lets students **register once and participate across every competition and
workshop, for years**, tracking their whole journey; (b) lets institutions/clubs **self‑manage their members and
verify their students**; (c) lets the community **volunteer, mentor, and contribute** with recognition on public
profiles; and (d) lets organizers **run the entire operation from an admin panel** with no external dependency for
core flows. Self‑hosted on the team's own VPS + database.

**In scope, phased:** accounts, profiles, programs/events/rounds, registration, **institutions/clubs with
self‑moderation & student verification**, **community roles (volunteer/mentor/contributor) + public profiles**,
results & certificates, resources, admin/CMS, notifications, then **payments (ShurjoPay)** and an **LMS**.
**Out of scope (further future):** automated online‑judge/code grading, public forum/social feed, native mobile apps.

---

## 2. Stack — decided

Chosen to match our existing self‑hosted workflow (Lightsail VPS, pm2 + nginx). These are the defaults I build on
unless a compatibility check against Next 16.2.9 forces the fallback.

| Concern | Decision | Fallback |
|---|---|---|
| Framework | **Next.js 16 App Router**, full Node server (drop static export) | — |
| Language | **TypeScript strict** | — |
| Styling | **Tailwind v4** + existing BdAIO tokens; small in‑house `components/ui` | — |
| DB | **PostgreSQL** (self‑hosted on the VPS) | Managed PG if ops load grows |
| ORM/migrations | **Prisma** | Drizzle |
| Auth | **Custom DB-backed sessions** (`jose`-signed cookie + `argon2`), per the official Next 16 auth guide — *decided in Phase 1, superseding Auth.js; see §3.5* | Auth.js v5 later, for OAuth only |
| Passwords | **argon2** | bcrypt |
| Validation | **Zod** (shared form/action/DB) | — |
| Forms | **React Hook Form + Zod** | — |
| Email | **Nodemailer over team SMTP** | Resend |
| File storage | **Local VPS disk at `UPLOAD_DIR`, served by nginx** — confirmed by the team; see §3.6 | — (self-hosted by choice) |
| PDF (certificates) | **@react-pdf/renderer** | pdf-lib |
| Payments *(Phase 8)* | **ShurjoPay** (BDT) | — |
| LMS *(Phase 9)* | **In‑house on this stack** | — |
| i18n | **EN + বাংলা** dictionary | — |
| Deploy | **pm2 + nginx on Lightsail**, Postgres alongside; nightly backups | — |

---

## 3. Architecture

### 3.1 The static → full‑stack shift (Phase 0)
| | Before | After |
|---|---|---|
| `next.config` | `output: "export"`, `images.unoptimized` | Node standalone server, Image optimization on |
| Data | `src/data/*.ts` constants | PostgreSQL via Prisma |
| Auth | none | session auth + RBAC |
| Deploy | copy `out/` to any host | Node process (pm2) behind nginx + Postgres |

### 3.2 Folder structure (target)
```
src/
  app/
    (marketing)/         public pages: home, about, programs, events, institutions, profiles, resources…
    (auth)/              login, register, verify-email, forgot/reset password
    (dashboard)/         participant / moderator / contributor area — auth required
    (admin)/             back-office — role: admin+
    api/                 route handlers: webhooks (ShurjoPay), uploads, cron-ish
  components/
    ui/                  design-system primitives (Button, Input, Card, Dialog, Badge…)
    <feature>/           feature components
  lib/
    db.ts                Prisma client singleton
    auth.ts              Auth.js config + helpers (getSession, requireRole, requireModeratorOf)
    validation/          Zod schemas (shared)
    email/               templates + send
    i18n/                dictionaries + helpers
  server/                server actions grouped by domain (users, institutions, events, community…)
  data/                  static/seed content during migration
prisma/
  schema.prisma
  migrations/
  seed.ts
```

### 3.3 Conventions
- **Auth guard helpers**: `requireUser()`, `requireRole('admin')`, `requireModeratorOf(institutionId)` in server
  actions/layouts.
- **Every mutation** = a server action in `src/server/<domain>/…` that (1) authenticates, (2) authorizes,
  (3) Zod‑validates, (4) writes, (5) logs to `ActivityLog`.
- **Design tokens** stay in `globals.css` (the existing BdAIO blue/emerald/slate palette) — no ad‑hoc colors.
- **Env** via `.env` (never committed): `DATABASE_URL`, `AUTH_SECRET`, SMTP creds, `SHURJOPAY_*`, `UPLOAD_DIR`.

### 3.4 Next.js 16 constraints (verified against installed 16.2.9)
Read from `node_modules/next/dist/docs/.../upgrading/version-16.md`. These shape how we build:
- **Deploy target** → `output: "standalone"` (done in Phase 0). Copy `public/` + `.next/static` next to the
  standalone `server.js`; run behind pm2 + nginx.
- **Turbopack is the default** dev/build compiler — no `--turbopack` flag; don't add a custom webpack config or
  builds fail.
- **Async request APIs are mandatory** — `cookies()`, `headers()`, `draftMode()`, and route `params`/`searchParams`
  are Promises and **must be `await`ed**. Impacts all auth/session code (Phase 1). Use `next typegen` for
  `PageProps`/`LayoutProps` helpers.
- **`middleware.ts` → `proxy.ts`** — the convention was renamed; runtime is **Node only** (no edge). Auth route
  protection lives in `proxy.ts` / exported `proxy()`, **not** the `middleware.ts` most NextAuth guides assume.
- **`next lint` removed** — lint via ESLint CLI directly (already our `package.json`); flat config is the default.
- **`serverRuntimeConfig`/`publicRuntimeConfig` removed** — read `process.env` directly; use `connection()` before
  reading runtime env in a server component to avoid build-time inlining. Client vars need `NEXT_PUBLIC_`.
- **Images** — `images.domains` deprecated → use `remotePatterns`; default `qualities` is `[75]`; local‑IP
  optimization blocked by default. We enabled optimization (dropped `unoptimized`).
- **Misc** — keep `scroll-behavior: smooth` working by adding `data-scroll-behavior="smooth"` to `<html>`;
  parallel-route slots now require `default.js`; `revalidateTag` needs a `cacheLife` 2nd arg.
- **Database-driven pages default to static.** A page that only queries Prisma (no `cookies()`/`headers()`) is
  **prerendered at build time**, so its data freezes until the next deploy — `next build` marks it `○ (Static)`.
  Public list pages therefore set `export const revalidate = 60`. Check the build output whenever a new
  DB-backed page is added; `ƒ (Dynamic)` is expected only where a session is read.
- **Server Actions cap request bodies at 1 MB** — see §3.6.

### 3.5 Auth architecture (decided in Phase 1 — supersedes Auth.js)

We build auth ourselves on the official Next 16 recipe (DAL + `cache()` + `proxy`) instead of Auth.js v5. Why:

1. **Auth.js credentials provider cannot use database sessions — it forces JWTs.** We need an admin to suspend an
   account and have access die *immediately*, plus a real audit trail. JWTs can't be revoked; DB sessions can.
2. With email/password we'd hand-write registration, email verification, and password reset anyway — Auth.js
   mainly pays off for OAuth, which we don't need yet.
3. Auth.js v5 is still beta; pairing its Prisma adapter with Prisma 7's new driver-adapter architecture stacks two
   bleeding edges.

Accepted trade-off: we own the security. Implementation rules:
- `Session` rows are the **only** authority; the cookie carries a `jose`-signed JWT wrapping *just* the opaque
  session id — never user data or roles.
- Passwords: **argon2id** (19 MiB, t=2, p=1). Login runs a dummy verify on unknown emails to keep timing uniform,
  and returns one generic "Incorrect email or password."
- Verification/reset tokens are stored as **SHA-256 hashes**, single-use, expiring.
- **`src/lib/auth/dal.ts` is the single choke point.** `getCurrentUser()` (React-`cache`d) validates the session,
  deletes expired rows, and denies suspended users. `requireUser` / `requireRole` / `requireModeratorOf` build on it.
- `src/proxy.ts` does an **optimistic cookie-presence check only** — no DB, no verification (it runs on every
  request incl. prefetches). It is a pre-filter, never the security boundary.

**Two Next 16 traps hit while building this** (both cost real debugging time):
- `proxy.ts` must sit **beside `app/`** — i.e. `src/proxy.ts` in this repo, not the project root. At the root it is
  silently ignored: no error, protection just doesn't happen. Verify with a route that has no page (`/admin`
  → expect 307, not 404), and confirm `ƒ Proxy (Middleware)` appears in `next build` output.
- The proxy bundle **cannot be async** ("CJS module can't be async"). Importing anything that reaches
  `server-only`/Prisma/`jose` breaks every route with a 500. Hence `src/lib/auth/constants.ts` — a dependency-free
  module for shared values like the cookie name.

### 3.6 File uploads & local storage (decided in Phase 1)

Everything is self-hosted on the team's own VPS, so uploads go to **local disk**, not object storage.

- **Location:** `UPLOAD_DIR` (default `./uploads`), deliberately **outside `public/`** — nothing is served merely
  because it exists on disk. Gitignored.
- **Serving:** `src/app/uploads/[...path]/route.ts` streams files in development. **In production, point nginx at
  `UPLOAD_DIR` for `/uploads`** so image bytes never pass through Node.
- **Profile photos: 1 MB limit**, JPEG/PNG/WebP in.
- **Every upload is re-encoded with `sharp`** (512×512 WebP, cover crop) rather than stored as received. One step
  buys three things: it proves the bytes really are an image (a renamed script fails to decode), it **strips EXIF
  including GPS coordinates** — which matters because most participants are minors — and it bounds stored size.
- **Filenames are server-generated** (`randomBytes(16).toString("hex") + ".webp"`); a client filename never
  reaches a path. Reads are allow-listed by regex and the resolved path is re-checked against `UPLOAD_ROOT`.
- Responses carry `nosniff`, a locked-down CSP, and immutable caching (names are random, so a new upload = new URL).
- Old files are deleted **after** the new filename commits, so a failed save never orphans the live photo.

> **Next 16 trap:** Server Actions cap request bodies at **1 MB by default**, so a 1 MB image plus form fields
> would be rejected before our own check ran. `experimental.serverActions.bodySizeLimit` is set to `2mb`; the
> 1 MB image rule is enforced in `saveAvatar()`.

**Backups must include `UPLOAD_DIR`, not just Postgres** — the database only stores filenames.

### 3.7 Email delivery (Phase 1–2)

Live on **Google Workspace SMTP** (`smtp.gmail.com:587`, app password in `.env`). `src/lib/email/mailer.ts` has
three modes, in order:
1. **No SMTP configured** → log the message (development before credentials exist).
2. **SMTP configured but not production** → compose and log, **do not deliver** (`EMAIL_DEV_SEND=true` overrides).
   This exists because seed/test accounts use unroutable `@example.com` addresses, and each send to one earns a
   bounce against the real sending domain — enough of them degrade deliverability for genuine participants.
3. **Production** → deliver.

A failed send never throws into a user flow: an account or registration must not roll back because mail was down.

> **Known limitation:** sends are **synchronous inside the request** — a password reset measured ~5s end to end.
> Acceptable now, but move to a background queue before opening registration to a full cohort.

### 3.7 The trust chain (built in Phase 3)

The credibility of a "Verified Student" badge is the whole point, so the chain is
deliberately gated at every step and no step can be self-served:

```
user proposes institution → status PENDING, invisible, no powers
  → ADMIN approves        → institution public + verified, moderators installed
    → student requests membership (PENDING)
      → MODERATOR approves membership
        → MODERATOR verifies it  → Verified Student badge granted
```

Enforced rules, each covered by a test:
- **Pending institutions are invisible** — excluded from every public query (directory, page, join list) and 404 on
  direct hit. A fake institution therefore cannot mint badges while awaiting review.
- **Approval is what installs moderators** — moderator memberships are created `PENDING` and only flip to
  `APPROVED` (and promote the account role) when an admin approves the institution.
- **`requireModeratorOf(institutionId)` scopes every membership action.** A moderator of one institution cannot
  approve or verify at another; admins may act anywhere.
- **A moderator cannot verify their own membership** (explicit self-check in `setMembershipVerified`).
- **Badges are granted only in `src/lib/community/badges.ts`**, always after an authorization check, and are
  **revocable** — rejecting a membership or role withdraws the badge.
- **Contributions require an approved community role**, so the public "contributions" list cannot be padded by
  anyone who has not been recognised.
- Every trust decision writes to `ActivityLog`; **rejected attempts write nothing**, so the audit trail never
  implies an action that did not happen.

**Public profile privacy** (`src/lib/community/publicProfile.ts` is the only way profile data leaves the server):
- **Private by default** — a profile appears only if its owner set `visibility: PUBLIC`; otherwise it 404s,
  indistinguishable from a non-existent handle. Suspended accounts disappear too.
- **Minors get a reduced profile**: given name only — no surname, Bengali name, bio, district, date of birth,
  phone, or address, whatever they filled in — plus `robots: noindex` and an on-page explanation.
- Institution member lists name only members who opted into a public profile.

### 3.8 Certificates (built in Phase 4)

- **Generated on demand, never stored.** The `Certificate` row is the source of truth and the PDF is rendered per
  request, so there are no files to back up and a revoked certificate stops being downloadable instantly.
- **`pdf-lib`, not `@react-pdf/renderer`** — chosen to avoid coupling PDF output to a React major version while
  React 19 / Next 16 are still settling.
- **`recipientName` is snapshotted at issue time**, so a later profile edit cannot rewrite an issued certificate.
- **Access control:** only the holder or an admin may download; anyone else gets **404, not 403**, so a serial
  cannot be probed for existence. A revoked certificate returns **410** even to its owner.
- **Public verification at `/verify/[serial]`** needs no login — that is the point, a third party must be able to
  check a certificate — but it exposes only what a verifier needs: name, what it was for, issue date, validity.
- Issuing is **idempotent and bulk**: it certifies every `APPROVED` registration on an event that lacks one, so it
  is safe to re-run as more entrants are approved.

### 3.9 Addresses & geography

Addresses are structured, not free text: **Division → District → Sub-district (upazila) → street**, captured twice
(**present** and **permanent**, since a Bangladeshi student's home district is often not where they study).

- **Data lives in `src/data/bd-geo.ts`** — 8 divisions, 64 districts, 495 upazilas, project‑owned. The only npm
  candidate had no repository, no homepage and ~39 weekly downloads; that is not a supply‑chain risk worth taking
  for a platform holding students' data. **The upazila list should be checked against the official BBS list before
  go‑live** — divisions and districts are authoritative.
- **`Combobox`** (`src/components/ui/Combobox.tsx`) is a type‑to‑search select: a 495‑option `<select>` is
  unusable, so every geo field filters as you type, ranks prefix matches first, and supports ↑/↓/Enter/Escape. The
  value is submitted through a hidden input, so Server Actions work with no client state library.
- **Cascading clears children**: changing division wipes district and upazila, so an impossible pair cannot even be
  assembled in the UI.
- **`isValidLocation()` re‑checks the triple server‑side.** The cascade is a convenience; a crafted POST pairing
  Sylhet with Dhaka district is rejected (tested).
- **"Same as present" is applied on the server** — the permanent address is copied from the present one rather than
  trusting whatever the disabled inputs happened to submit.
- **Institution suggestions are scoped to the chosen district** via `/api/institutions/search`, which returns only
  `APPROVED` institutions (so pending submissions cannot be discovered) and is debounced client‑side. Typing alone
  never sets an institution — the user must pick from the list, so free text cannot invent one.
- **Directory search** (`/institutions?q=&division=&district=`) keeps its state in the URL so a filtered view is
  shareable; filtering happens in the query, and the page is `force-dynamic` because it depends on search params.
- **Privacy:** only the **district** is ever exposed on a public profile — never upazila or street, which would
  narrow a participant to a neighbourhood. Minors expose no location at all (§3.7).

> **Seed lesson learned twice:** `upsert({ update: {} })` silently leaves existing rows stale after a schema
> change, which produced empty division filters and missing profile geo. Seed `update` blocks now mirror `create`
> so re‑running backfills. Check this whenever fields are added.

### 3.10 Results & scoring (built in Phase 5)

Two separate authorities, because marking and announcing are different responsibilities:

- **Scoring** — an admin, *or* a judge assigned to **that specific round** (`RoundJudge`). A judge for the
  preliminary cannot touch the national marks; a crafted `roundId` is rejected (tested).
- **Publishing** — admin only. The judge view has no publish control at all, and `publishRoundResults` requires
  `ADMIN` server‑side.

- **`published` is the visibility gate.** Draft marks are invisible to the public leaderboard, the results index,
  **and to the participant they belong to** — so partial marking can never leak a standing (tested).
- **Ranks are derived, never typed.** `recomputeRanks()` orders by marks descending; equal marks share a rank and
  the next distinct mark continues the count (88, 88 → 1, 1; then 55 → 3).
- **Publishing produces a complete outcome in one action**: medal badges granted, achievement certificates issued
  with the medal in the detail line, and every entrant notified.
- **Leaderboard privacy:** a participant who has not opted into a public profile appears by **initials only**, so
  publishing standings never outs someone who chose to stay private.

> **Next 16 trap:** every export from a `"use server"` file must be an async function. A synchronous helper
> (`medalLabel`) exported alongside the actions broke the whole module and 500'd every page importing it. Shared
> sync helpers live in a plain module (`src/lib/results/medals.ts`).

---

## 4. Domain model

Three‑level competition hierarchy, a first‑class institution/community layer, and a permanent user identity that
spans everything.

```
Program            BdAIO · APAIO · Winter AI Olympiad · IOAI pathway · "BdAIO Workshops"
  └─ Event         a concrete offering, TYPED:
       │             OLYMPIAD_EDITION | REGIONAL_ROUND | WORKSHOP | SEMINAR | COURSE | BOOTCAMP
       └─ Round     stages — ONLY for olympiad-type events (Prelim → National → Camp → Intl)
```

- **`Program`** — recurring brand/series. `scope` (local/national/regional/international), `isExternal` (we host
  vs merely nominate students to it, e.g. IOAI/APAIO).
- **`Event`** — one instance of a Program. `type` (enum above), `year`, `mode` (online/offline/hybrid),
  venue/link, `capacity`, `fee` (nullable), `status` (draft/open/running/archived). **Editions recur yearly and
  are never overwritten**; admin can **clone last year's** as a starting point. A workshop/seminar/live course is
  just an Event with the matching `type` and no Rounds.
- **`Round`** — olympiad stages: `order`, mode, venue, schedule, registration window, advancement eligibility.

**Identity & profile**
- `User` — email, passwordHash, **accountRole**, status (pending/active/suspended), emailVerifiedAt
- `Session`/`Account` — per Auth.js
- `Profile` — **username/handle** (public URL), fullName (EN/BN), photo, dob, gender, phone, address,
  division/district, bio, **`visibility` (private | public)** — **permanent across all programs/editions**

**Institutions & community** *(Phase 3)*
- `Institution` — school/college/university/**club**/community: name (EN/BN), slug, `type`, district, logo,
  description, website, `status` (pending/approved/suspended), `verified` (admin‑verified org). **Self‑registered**
  by a user, who becomes its first moderator **once an admin approves the institution**.
- `InstitutionMembership` — user ↔ Institution: `membershipRole` (STUDENT/MEMBER/VOLUNTEER/**MODERATOR**),
  `status` (pending/approved/rejected), **`verified` (bool)**, `verifiedBy`, `verifiedAt`. A moderator verifying a
  student's membership is what grants the **"Verified Student" badge** on that student's profile.
- `CommunityRole` — user: `type` (**VOLUNTEER / MENTOR / CONTRIBUTOR**), `scope` (GLOBAL | institutionId),
  `status` (applied/approved/rejected), `approvedBy`, `since`. **Additive** — a user can hold several alongside
  their account role. Institution‑scoped roles approved by that institution's moderator; global ones by admin.
- `Contribution` — user: `kind` (organizing / mentoring / content / translation / judging / other), title (EN/BN),
  description, relatedProgram/Event (nullable), date, `hours` (for volunteers), `verifiedBy`. Powers the
  **"Contributions" section** of the public profile.
- `GuardianInfo` — for minors: name, relation, phone

**Participation**
- `Registration` — user ↔ Event (+ Round when applicable; null for workshops). status
  (applied/approved/rejected/waitlisted/withdrawn), category/age‑group. **Same flow for an olympiad round or a
  workshop seat.**
- `Team` *(optional, if team events exist)* — name, members, mentor
- `Submission` *(Phase 5)* — registration ↔ round: files/answers
- `Score`/`Result` — registration ↔ round: marks, rank, medal, published flag
- `Achievement`/`Badge` — user: `type`, title, awardedFor, awardedAt. Covers **olympiad medals** and **system
  badges** (Verified Student, Verified Institution, Volunteer, Mentor, Contributor); some auto‑granted on
  verification/role approval, shown on the public profile.
- `Certificate` — user + event/round: type, serial, PDF path, issuedAt

**Content**
- `Resource` (+ `ResourceCategory`) — type, file/URL, visibility (public/members)
- `Announcement`, `Page`/`ContentBlock` (CMS‑lite), `FAQ`, `MediaAsset`, `Sponsor`, `ContactMessage`

**LMS** *(Phase 9)* — `Course` → `CourseModule` → `Lesson`; `Enrollment`, `LessonProgress`; `Quiz` → `Question`,
`QuizAttempt`; optional `CourseCertificate` (reuses the cert pipeline).

**System**
- `Notification` — user, type, payload, readAt
- `ActivityLog` — user, action, entity, ts (drives the user activity feed + admin/moderator audit trail)
- `Payment` *(Phase 8)* — registration, provider=**ShurjoPay**, amount, BDT, status, txnId, gatewayRef, paidAt

---

## 5. Roles — three axes

Roles are modeled on **three independent axes** so they compose cleanly (a person can be a Participant + a
Volunteer + a Judge on one round, all at once).

**A. Account role** — one primary RBAC level per user
| Role | Scope |
|---|---|
| **Guest** | Public pages, view results & profiles, sign up |
| **Participant** | Own profile, register/enroll, submit, own achievements/certificates, member resources |
| **Institution Moderator** | **Their own institution only:** approve member & volunteer requests, **verify students** (→ badge), edit the institution's public page. Not global admin |
| **Admin** | Manage users, institutions, programs, events, rounds, registrations, results, resources, content, community role approvals |
| **Super‑admin** | Admin + manage admins + system settings |

**B. Community roles** — additive, opt‑in, applied‑for, shown on the public profile
| Role | Meaning |
|---|---|
| **Volunteer** | Helps run events/workshops; logs volunteer hours/contributions. Global (admin‑approved) or institution‑scoped (moderator‑approved) |
| **Mentor** | Guides/coaches students; can be tied to an institution or a program |
| **Contributor** | Contributes content, translations, problems, etc.; contributions listed publicly |

**C. Operational assignments** — granted per task, not a global role
| Assignment | Meaning |
|---|---|
| **Instructor / Facilitator** | Runs a specific workshop/course, sees its enrollees, marks attendance |
| **Judge / Reviewer** | Assigned to a specific round; enters scores |

MVP account roles: **Participant / Institution Moderator / Admin / Super‑admin**. Community roles land in Phase 3;
operational assignments with their features (Phase 2 workshops, Phase 5 judging).

---

## 6. Modules → screens

- **Public** — Home, About, **Programs** (list + program page), **Events** (list + detail, incl. workshops/courses),
  **Workshops** (filtered), **Institutions/Clubs** (directory + institution page), **Public profiles** (`/u/[handle]`),
  Results/leaderboard, Resources, FAQ, Contact, Archives, Syllabus/Guideline/Rules.
- **Auth** — register, email verify, login/logout, forgot/reset password, profile onboarding.
- **Dashboard `/dashboard`** — overview, Profile, **My Institution** (join/see status; moderator sees management),
  Registrations, **My Roles** (apply: volunteer/mentor/contributor), **My Contributions**, Activity, Achievements,
  Certificates, Resources, Notifications, Settings (incl. public‑profile visibility); **My Learning** (P9).
- **Institutions & clubs** — public directory + institution page; **"Register your institution/club"** →
  admin approval → registrant becomes moderator; **moderator console**: approve/reject membership & volunteer
  requests, **verify students** (grant badge), manage the institution's public page & roster.
- **Community & public profiles** — apply to become Volunteer/Mentor/Contributor (global or institution‑scoped);
  approval queue (admin or moderator); log contributions; **public profile** shows name, photo, institution
  (+ Verified Student badge), roles, olympiad medals/achievements, and the contributions list. Visibility toggle.
- **Programs/events/registration** — program → event → (round | workshop) → register/enroll (eligibility, capacity,
  waitlist, guardian info for minors) → confirmation email → ShurjoPay checkout for paid events (P8). External
  olympiads (APAIO/IOAI) show as info + participation/results tracking, not open registration.
- **Results** — score entry/import, publish, public + private views, auto‑certificates.
- **Resources library** — categorized, public vs members‑only, searchable.
- **Admin `/admin`** — stats, users, **institutions** (approve/verify orgs, assign/replace moderators),
  **community roles** (approve global volunteers/mentors/contributors), programs, events/rounds (any type),
  registrations (approve/reject/export), results, resources, announcements, CMS content, sponsors, media, messages,
  audit log, settings, payments (P8), courses (P9).
- **Comms** — transactional email, in‑app notifications, announcements, optional SMS.
- **LMS (P9)** — courses/modules/lessons, enrollment + progress, auto‑graded quizzes, course certificates.

---

## 7. Route map

```
Public     /  /about  /programs  /programs/[slug]  /events  /events/[slug]  /workshops
           /institutions  /institutions/[slug]  /institutions/register
           /u/[handle]                                 (public profiles)
           /results  /resources  /faq  /contact  /archives
           /syllabus  /participation-guideline  /rules
Auth       /login  /register  /verify-email  /forgot-password  /reset-password
Dashboard  /dashboard  /dashboard/{profile,institution,registrations,roles,contributions,
           activity,achievements,certificates,resources,notifications,settings,learning(P9)}
           /dashboard/institution/{members,volunteers,verify}   (moderator console)
Admin      /admin  /admin/{users,institutions,community,programs,events,registrations,results,
           resources,announcements,content,media,messages,logs,settings,payments(P8),courses(P9)}
           /admin/events/[id]/rounds
Learn(P9)  /learn  /learn/[course]  /learn/[course]/[lesson]  /learn/[course]/quiz/[id]
API        /api/{auth,uploads,webhooks/shurjopay(P8)}
```

---

## 8. Execution roadmap

**MVP = Phases 0–4.** Each phase = a deployable slice.

| Phase | Theme | Engineering tasks |
|---|---|---|
| **0 Foundation** ✅ | static → app | *Done:* `output:"standalone"`; Prisma 7 + Postgres + migrations; `.env`/`.env.example`; `src/lib/db.ts`; seed script; `components/ui`; Next patched to 16.2.12. *Outstanding:* pm2/nginx/Postgres provisioning + nightly backups (server-side, not yet done) |
| **1 Accounts** 🟡 | auth & profiles | *Done:* register/login/logout, email verification (+resend), password reset, `User`/`Profile`/`Institution`/`GuardianInfo`, `Session`/`AuthToken`, DAL + RBAC helpers, `src/proxy.ts` guard, `/dashboard` shell + nav, profile editing with minor/guardian rules, `ActivityLog`. *Outstanding:* SMTP credentials (transport is built and pluggable), profile **photo upload**, auth **rate limiting**, public profile page `/u/[handle]` (lands with Phase 3) |
| **2 Programs/Events** ✅ | core flow | *Done:* public `/programs`, `/programs/[slug]`, `/events`, `/events/[slug]`, `/workshops`; typed events; registration + enrolment with windows, eligibility, capacity → **waitlist**; withdraw; bilingual confirmation & decision emails; `/dashboard/registrations`; rules isolated in `src/lib/events/registration.ts`. **Admin back-office:** `/admin` stats + audit feed, program CRUD, event CRUD (incl. **clone next year's edition**), round management with delete-protection, registration review (approve/reject) with filters, and **CSV export** of participant data. Seed covers 4 programs, 6 events, 5 participants, and registrations in all 5 states |
| **3 Community & Institutions** ✅ | trust & recognition | *Done:* `Institution` self‑registration → admin approval → moderators installed; `InstitutionMembership` + moderator console (approve/reject members, **verify students → Verified Student badge**); `CommunityRole` volunteer/mentor/contributor applications with scoped approval (moderator) vs global (admin); `Contribution` log gated on an approved role; `Badge` model with grant/revoke centralised in `src/lib/community/badges.ts`; **public profiles `/u/[handle]`** via a DTO that enforces opt‑in visibility and minor redaction; institution directory + pages; admin institution & community queues |
| **4 Journey** ✅ | participant value | *Done:* activity feed (`ActivityLog` → readable sentences), achievements page with badge/stat summary, **certificates issued in bulk per event + PDF generated on demand (pdf-lib) + public `/verify/[serial]`**, revocation, resource library with public vs members‑only filtering, notification centre wired into registration/verification/role/certificate events, admin certificates screen |
| **5 Results** ✅ | scoring | *Done:* `Result` + `RoundJudge` models; per‑round mark sheet with **ranks derived from marks** (ties share a rank); **publish gate** — nothing visible to participant or public until an admin publishes; judge assignment scoped per round; publishing awards medal badges, **auto‑issues achievement certificates**, and notifies; public `/results` index + per‑event leaderboard; participant `/dashboard/results`; judge `/dashboard/judging`. *Outstanding:* CSV score import, submissions |
| **6 Admin/CMS** | organizer control | Full back‑office, CMS for public copy, announcements, CSV export, audit log |
| **7 Polish** | hardening | i18n completeness, SEO/sitemap, PWA, analytics, rate limiting, backups, SMS |
| **8 Payments** | fees | **ShurjoPay** checkout on registration, `Payment` records + webhook, receipts, admin payments/reconciliation |
| **9 LMS** | learning | Courses/modules/lessons, enrollment + progress, auto‑graded quizzes, course certificates, "My Learning" + admin authoring |

---

## 9. Assumptions I'm building to (override if wrong)

**✅ Approved 2026‑07‑31** — the team signed off on proceeding with these defaults (CTO's call), still overridable
anytime as we learn. These are product calls; I proceed on the default so engineering isn't blocked.

1. **DB hosting** → Postgres on the same VPS. *(cheapest; revisit if load grows)*
2. **Auth** → Auth.js v5; custom cookie session only if it's not Next‑16‑ready.
3. **Payments** → ShurjoPay, **Phase 8**. Open sub‑questions: fee per‑edition vs per‑round, flat vs by‑category,
   refund policy. *Default:* flat fee per Event, no refunds.
4. **Signup data** → email + name + institution + class required; guardian info required for minors; NID/birth‑cert
   **not** collected unless verification demands it. *(privacy‑minimizing default)*
5. **Individual vs team** → individual only; add `Team` if a team round appears.
6. **Existing static pages** → keep as static content components in P0–1, migrate into CMS/DB in P6.
7. **Domains** → prod + a **staging** subdomain before go‑live.
8. **Data migration** → assume no legacy import unless given a dataset.
9. **External olympiads (APAIO/IOAI/Winter)** → default to **info + participation/results tracking only** (no open
   registration); flip a Program to full registration if we actually host it.
10. **Workshops/courses** → default **paid‑optional, open to guests with an account**; a live workshop may get a
    companion LMS course (P9) for materials/recording.
11. **Public profiles** → **private by default; user opts in** to a public profile. **Minors' public profiles are
    limited** (first name + institution + badges/achievements only — no DOB, phone, address, or contact).
12. **Institution/club registration** → any account may register one, but it stays **pending until an admin
    approves**; the registrant becomes its moderator on approval. Institutions can hold **multiple moderators**.
13. **"Verified Student" badge** → only from an **approved membership that the institution's moderator has
    verified** — never self‑claimed. Institution‑scoped volunteers are moderator‑approved; global
    volunteers/mentors/contributors are admin‑approved.

---

## 10. Engineering standards

- **Security** — server‑side RBAC (incl. institution‑scoped `requireModeratorOf`) + Zod on every mutation; argon2
  passwords; secure/httpOnly session cookies; CSRF protection; rate‑limit auth + registration; signed ShurjoPay
  webhooks (P8).
- **Trust & abuse** — institution self‑registration and verification are **admin‑gated**; every verification and
  role approval is written to `ActivityLog`; moderators & badges are **revocable**; guard against fake
  institutions and self‑verification.
- **PII & minors** — privacy policy + consent from P1; minors' public profiles limited by default; encrypted at
  rest where sensible; data‑retention & account deletion path; least‑data collection.
- **Data** — Prisma migrations reviewed before apply; **nightly Postgres + `/uploads` backups** from P0; seed
  script for local/dev.
- **Quality** — typecheck + lint in CI; unit tests for validation/business logic; e2e smoke on the critical path
  (register → verify → login → register‑for‑event); accessibility (WCAG AA); Lighthouse budget for the BD network.
- **Ops** — pm2 process + nginx reverse proxy; `.env` per environment; structured logs; health check endpoint.
- **Git** — feature branches, no direct commits to `main`; no auto commit/deploy (only on request); no secrets in
  history; commits without Co‑Authored‑By trailers.

---

## 11. Risks

- **Next 16 breaking changes** — verify every lib against the installed version; read `node_modules/next/dist/docs/`
  per task. Biggest risk to auth/ORM choices.
- **Scope creep** — the feature surface is huge by design. Hold the line: MVP (0–4) first; payments (8) & LMS (9)
  are committed but deferred; ship each piece lean.
- **Trust layer is gameable** — fake institutions, bogus student verification, or self‑awarded badges would erode
  credibility. Mitigate with admin approval of institutions, moderator accountability, full audit logs, and
  revocation. This is the riskiest new surface.
- **Minors' privacy** — public profiles + institution rosters expose student data; privacy‑limited defaults are a
  legal/security obligation, not a nicety.
- **Multi‑program complexity** — the Program→Event→Round + typed‑events model absorbs olympiads, regional rounds,
  and workshops without special‑casing; resist per‑competition forks.
- **Bengali parity** — admin/CMS/profile text must not drift English‑only.

---

## 12. Immediate next actions

1. ~~Confirm the §9 assumptions~~ — **approved 2026‑07‑31**; building to those defaults. Still open to override,
   and a few sub‑questions remain (payment fee structure, whether any team rounds exist, which external olympiads
   we actually host) — I'll surface these when the relevant phase starts, not block on them now.
2. **Phase 0 kickoff:** read Next 16 docs → drop `output:"export"` → stand up Postgres + Prisma → first migration
   for `User`/`Profile`/`Institution`/`Program`/`Event`/`Round`/`Registration` → seed script → base design‑system +
   app shell → pm2/nginx/Postgres + backups.
3. **Phase 1:** auth + profile, so there are real accounts to build everything else on.

*Living document — I revise it as reality teaches us.*
