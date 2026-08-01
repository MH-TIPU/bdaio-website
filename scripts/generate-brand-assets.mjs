#!/usr/bin/env node
/**
 * Generates the PWA icons and the default Open Graph image from the master logo.
 *
 * Run with `npm run assets:brand`. The outputs are committed so a deploy never
 * depends on this script — re-run it only when the logo changes.
 *
 * The app icons crop to the head glyph rather than squeezing the full wordmark
 * into a square: at 192px a shrunken "BdAIO" is illegible, while the head reads
 * fine. Everything sits on white because the glyph is navy and both Android and
 * iOS composite icons onto backgrounds we don't control.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const LOGO = path.join(ROOT, "public/media/2026/03/bdaio-logo-.png");
const OUT = path.join(ROOT, "public");

/** The head glyph within the 2431×902 master, hand-measured. */
const GLYPH = { left: 30, top: 10, width: 780, height: 885 };

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/** Square icon: glyph centred on white, `padding` as a fraction of the side. */
async function icon(size, padding, file) {
  const inner = Math.round(size * (1 - padding * 2));
  const glyph = await sharp(LOGO)
    .extract(GLYPH)
    .resize(inner, inner, { fit: "contain", background: { ...WHITE, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: glyph, gravity: "centre" }])
    .png()
    .toFile(path.join(OUT, file));

  console.log(`  ${file}  ${size}×${size}`);
}

/** 1200×630 social card: the full wordmark on white over the brand rule. */
async function openGraph() {
  const wordmark = await sharp(LOGO)
    .resize(760, null, { fit: "inside" })
    .png()
    .toBuffer();

  const rule = await sharp({
    create: { width: 1200, height: 14, channels: 4, background: { r: 2, g: 111, b: 137, alpha: 1 } },
  })
    .png()
    .toBuffer();

  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: WHITE },
  })
    .composite([
      { input: wordmark, gravity: "centre" },
      { input: rule, top: 616, left: 0 },
    ])
    .png()
    .toFile(path.join(OUT, "og.png"));

  console.log("  og.png  1200×630");
}

await mkdir(OUT, { recursive: true });
console.log("Generating brand assets from", path.relative(ROOT, LOGO));

// Android home screen / install prompt.
await icon(192, 0.1, "icon-192.png");
await icon(512, 0.1, "icon-512.png");
// Maskable icons get cropped to a platform-chosen shape; keep the glyph inside
// the 80% safe zone so a circular mask cannot clip it.
await icon(512, 0.2, "icon-maskable-512.png");
// iOS ignores `manifest.icons` and reads apple-touch-icon.
await icon(180, 0.1, "apple-icon.png");
await openGraph();

console.log("Done.");
