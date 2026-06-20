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

## Production Build

```bash
npm run build
npm start
```

All pages are statically generated and ready for deployment to Vercel, Netlify, or any static host.

## Next Steps

- Replace sponsor text badges with actual logo images
- Add hero background/robot image assets from the original site
- Admin dashboard for content management
- Dynamic results and event pages
