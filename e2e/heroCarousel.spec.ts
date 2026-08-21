import { expect, test } from "@playwright/test";
import { closeDb } from "./helpers";

/**
 * The hero rotation, and the controls that make it allowed to rotate.
 *
 * WCAG 2.2.2 requires a way to stop content that moves by itself, so the pause
 * button is not a convenience — without it the carousel would be a conformance
 * failure on the busiest page of the site, which is scored against a 0.98
 * accessibility floor in CI. That is why "pause actually stops it" is asserted
 * here rather than left to the axe scan, which can see the button exists but
 * not that pressing it does anything.
 *
 * Order is deliberate: autoplay is checked **before** any mouse interaction,
 * because hovering the carousel suspends it on purpose. A test that clicked
 * first would park the pointer over the hero and then wait forever for a slide
 * that is never going to advance.
 */

test.afterAll(async () => {
  await closeDb();
});

const activeDot = "button[aria-current='true']";

test("the hero rotates on its own, and the pause button stops it", async ({ page }) => {
  await page.goto("/");

  const hero = page.locator("section.site-hero-media");
  const dots = hero.locator("button[aria-label^='Show highlight']");
  await expect(dots, "one dot per slide").toHaveCount(2);

  const pause = hero.locator("button[aria-label='Pause the highlights']");
  await expect(pause).toBeVisible();

  // --- Autoplay. No mouse yet, so nothing is suspending it. ----------------
  // The first slide is the one prerendered, so the rotation is proven by the
  // second becoming current without anyone asking for it.
  const first = dots.nth(0);
  const second = dots.nth(1);
  await expect(first, "the first slide starts current").toHaveAttribute("aria-current", "true");
  await expect(second, "it should advance on its own within ~5s").toHaveAttribute(
    "aria-current",
    "true",
    { timeout: 9_000 },
  );

  // --- Pause must actually stop it, not just relabel itself ----------------
  await pause.click();
  await expect(
    hero.locator("button[aria-label='Play the highlights']"),
    "the control should offer to resume once paused",
  ).toBeVisible();

  const pausedOn = await hero.locator(activeDot).getAttribute("aria-label");
  // Longer than the 5s interval: if the timer were still running this would
  // have moved on by now.
  await page.waitForTimeout(6_500);
  expect(
    await hero.locator(activeDot).getAttribute("aria-label"),
    "a paused carousel must not advance",
  ).toBe(pausedOn);

  // --- The dots still navigate while paused -------------------------------
  await first.click();
  await expect(first).toHaveAttribute("aria-current", "true");
  await expect(second).not.toHaveAttribute("aria-current", "true");
});

test("only the current slide is exposed to assistive technology", async ({ page }) => {
  await page.goto("/");

  const hero = page.locator("section.site-hero-media");
  // Both banners are in the DOM so the cross-fade has something to fade to, but
  // a screen reader must be offered exactly one of them — otherwise the page
  // reads as though every banner were on it at once.
  const slides = hero.locator("div[aria-hidden]");
  await expect(slides).toHaveCount(2);
  await expect(hero.locator("div[aria-hidden='false']")).toHaveCount(1);

  // The heading belongs to the page, not the carousel, and there must be one.
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(hero.locator("[aria-roledescription='carousel']")).toBeVisible();
});
