import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { closeDb, ensureCourse } from "./helpers";

/**
 * WCAG 2.1 AA, checked automatically on the pages a participant actually meets.
 *
 * Automated rules catch perhaps a third of real accessibility problems — they
 * find a missing label or a failing contrast ratio, not a form that is
 * technically labelled and still impossible to understand. So this is a floor,
 * not a certificate: it stops the regressions a reviewer would miss, and it does
 * not replace someone using the site with a screen reader.
 *
 * The keyboard journey through sign-up lives in `criticalPath.spec.ts`, which is
 * the other half of this and the half a scanner cannot do.
 */
// Canonical un-prefixed paths. The proxy still 301s legacy `/en/*` and `/bn/*`
// here, but asserting against the redirect target is what a visitor loads.
const PAGES = [
  { name: "home", path: "/" },
  { name: "events", path: "/events" },
  { name: "register", path: "/register" },
  { name: "login", path: "/login" },
  { name: "contact", path: "/contact" },
  { name: "FAQ", path: "/faq" },
  { name: "resources", path: "/resources" },
  { name: "courses", path: "/learn" },
  { name: "a course", path: "/learn/e2e-course" },
];

// The course pages need a course to look at, and the suite owns its fixtures.
test.beforeAll(ensureCourse);

test.afterAll(async () => {
  await closeDb();
});

for (const { name, path } of PAGES) {
  test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Report what failed and where, so a failure is actionable from the log
    // alone rather than sending someone to reproduce it locally first.
    const summary = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target.join(" ")),
    }));

    expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
  });
}

test("each page has exactly one h1", async ({ page }) => {
  // One h1 is what tells a screen-reader user what the page is. None at all —
  // which is what an image-led hero produces if nobody notices — leaves the
  // heading outline starting at level 2; several is a heading used for styling.
  for (const { name, path } of PAGES) {
    await page.goto(path);
    expect(await page.locator("h1").count(), name).toBe(1);
  }
});
