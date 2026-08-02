import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { closeDb } from "./helpers";

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
const PAGES = [
  { name: "home", path: "/en" },
  { name: "home (Bengali)", path: "/bn" },
  { name: "events", path: "/en/events" },
  { name: "register", path: "/en/register" },
  { name: "login", path: "/en/login" },
  { name: "contact", path: "/en/contact" },
  { name: "FAQ", path: "/en/faq" },
  { name: "resources", path: "/en/resources" },
];

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

test("the language toggle switches language and the document says so", async ({ page }) => {
  await page.goto("/en");
  // A button, not a link: it rewrites the current path rather than navigating
  // to a fixed one, and it is labelled for a screen reader ("Switch to বাংলা").
  const bengali = page.getByRole("button", { name: /বাংলা/ });
  await expect(bengali).toBeVisible();
  await bengali.click();

  await page.waitForURL("**/bn");
  // `lang` has to follow, or a screen reader keeps reading Bengali in English.
  await expect(page.locator("html")).toHaveAttribute("lang", /^bn/);
});
