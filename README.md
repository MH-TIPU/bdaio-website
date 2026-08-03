# BdAIO Website

Official website for the **Bangladesh Artificial Intelligence Olympiad (BdAIO)** — rebuilt with Next.js.

## Tech Stack

- **Next.js 16** (App Router, static generation)
- **TypeScript**
- **Tailwind CSS v4**
- **Google Fonts** — Inter (English) + Hind Siliguri (Bengali)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, sponsors, mission, journey timeline |
| `/about` | About BdAIO |
| `/contact` | Contact information |
| `/faq` | FAQ (Bengali accordion) |
| `/syllabus` | Competition syllabus |
| `/participation-guideline` | Participation guidelines (Bengali) |
| `/rules` | Competition rules |
| `/result` | Results (placeholder) |
| `/events` | BdAIO 2026 event schedule |
| `/archives` | Past events |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test              # unit + integration
npm run test:unit     # no database needed
npm run test:watch
```

The **unit** project covers pure logic — registration rules, the public-profile
redaction, phone and geography validation, CSV import, the settings registry.

The **integration** project runs server actions against a real database (the
trust chain and the critical path), so it needs its own:

```bash
createdb bdaio_test
export TEST_DATABASE_URL="postgresql://localhost:5432/bdaio_test?schema=public"
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
npm run test:integration
```

Without `TEST_DATABASE_URL` those tests report as **skipped**, never as passed —
and in CI a missing database fails the run. The suite truncates every table
between cases, so it refuses to start against a database whose name does not end
in `_test`.

### Browser tests and the performance budget

Both run against a production build, started for you:

```bash
npm run build
npm run test:e2e          # critical path + WCAG 2.1 AA scans (Playwright + axe)
npm run test:lighthouse   # performance budget, throttled to a mid-range phone
```

Both start the server themselves with `npm run start:standalone`, which is also
the correct way to run a production build locally — `next start` refuses an
`output: "standalone"` build, and the standalone bundle does not carry its own
static assets.

`test:e2e` needs `TEST_DATABASE_URL` too, seeded (`npm run db:seed` against it).
The budget lives in `lighthouserc.cjs`; tighten it when a page improves, and do
not loosen it to make a build pass.

## Production Build

```bash
npm run build
npm start
```

This is a full Node server (`output: "standalone"`), not a static export — it
needs PostgreSQL and the environment in `.env.example`. See `docs/OPS.md` for
the deployment, and `docs/PLATFORM_PLAN.md` for what is built and what is not.
