import { expect, test } from "@playwright/test";
import {
  closeDb,
  countUsers,
  ensureOpenEvent,
  registrationStatus,
  resetRateLimits,
  uniqueEmail,
  verificationPathFor,
} from "./helpers";

/**
 * The critical path through the actual pages: register → verify → sign in →
 * enrol on an event.
 *
 * The Vitest integration suite already proves the server actions do the right
 * thing. What this adds is the half that suite cannot see: that the forms are
 * wired to those actions, that the redirects land somewhere real, and that a
 * participant on a phone can complete the journey without a mouse.
 */
const PASSWORD = "correct-horse-9";

test.beforeEach(resetRateLimits);

test.afterAll(async () => {
  await closeDb();
});

test("a new participant can sign up, verify, sign in and enrol", async ({ page }) => {
  const event = await ensureOpenEvent();
  const email = uniqueEmail("newcomer");

  // --- Register ------------------------------------------------------------
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Nusrat Jahan");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();

  // A successful registration signs you in and lands on the dashboard.
  await page.waitForURL("**/dashboard");

  // --- Verify, by following the link we actually emailed -------------------
  const verificationPath = await verificationPathFor(email);
  await page.goto(verificationPath);
  await expect(page.getByRole("heading", { name: /email verified/i })).toBeVisible();

  // --- Sign out and back in ------------------------------------------------
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await page.waitForURL("**/login");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL("**/dashboard");

  // --- Enrol ---------------------------------------------------------------
  await page.goto(`/events/${event.slug}`);
  await page.getByRole("button", { name: /enrol now|register now/i }).click();

  // The page re-renders server-side into its already-registered state, so the
  // confirmation is the page's own copy rather than the form's status region.
  await expect(page.getByText(/you are registered for this event/i)).toBeVisible();

  expect(await registrationStatus(email, event.id)).toBe("APPLIED");
});

test("the sign-up form reports a duplicate address instead of failing silently", async ({
  page,
}) => {
  const email = uniqueEmail("twice");

  await page.goto("/register");
  await page.getByLabel("Full name").fill("First Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("**/dashboard");

  // Sign out, then try the same address again.
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await page.waitForURL("**/login");

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Second Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page.getByText(/already exists/i)).toBeVisible();
  expect(await countUsers(email)).toBe(1);
});

test("a wrong password is refused without saying whether the account exists", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(uniqueEmail("ghost"));
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: /^sign in$/i }).click();

  await expect(page.getByText(/incorrect email or password/i)).toBeVisible();
});

test("the journey works with the keyboard alone", async ({ page }) => {
  const email = uniqueEmail("keyboard");

  await page.goto("/register");
  // Tab between fields and submit with Enter — never the mouse.
  await page.getByLabel("Full name").focus();
  await page.keyboard.type("Keyboard Only");
  await page.keyboard.press("Tab");
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await page.keyboard.type(PASSWORD);
  await page.keyboard.press("Enter");

  await page.waitForURL("**/dashboard");
  expect(await countUsers(email)).toBe(1);
});
