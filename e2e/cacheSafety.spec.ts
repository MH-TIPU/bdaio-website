import { expect, test } from "@playwright/test";
import { closeDb, resetRateLimits, uniqueEmail } from "./helpers";

/**
 * The public pages are prerendered and revalidated, which means one rendered
 * HTML document is served to everybody who asks for it. That is the whole point
 * — and it is only safe while nothing about *you* is in that document.
 *
 * This is the test for that invariant. It is not a performance test: it is the
 * guard on the failure mode the caching bought, where a signed-in visitor's name
 * is rendered into a cached page and handed to the next stranger who loads it.
 *
 * The way to break it is ordinary and tempting: read the session in
 * `src/app/(public)/layout.tsx` again, or pass a user into a component the
 * layout renders. Both would make this fail, which is why it exists.
 */

const PASSWORD = "correct-horse-9";
const CANARY_NAME = "Cache Leak Canary";

test.beforeEach(resetRateLimits);

test.afterAll(async () => {
  await closeDb();
});

test("a signed-in visitor's identity never reaches cached public HTML", async ({
  page,
  context,
}) => {
  const email = uniqueEmail("canary");

  // Registering signs you in and lands on the dashboard.
  await page.goto("/register");
  await page.getByLabel("Full name").fill(CANARY_NAME);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("**/dashboard");

  /**
   * Same-origin `fetch` from inside the page, rather than Playwright's request
   * API: it sends the session cookie exactly as the header's own code does, and
   * returns the body without executing any of it. So this is the HTML the
   * server put in its cache, fetched by someone who *is* signed in.
   */
  const fetchInPage = (path: string) =>
    page.evaluate(async (p) => {
      const response = await fetch(p, { credentials: "same-origin" });
      return {
        status: response.status,
        cacheControl: response.headers.get("cache-control") ?? "",
        body: await response.text(),
      };
    }, path);

  // The session endpoint is the one place identity may travel, so it carries
  // the whole burden: it must know who we are, and must never be cached.
  const me = await fetchInPage("/api/session/me");
  expect(me.status).toBe(200);
  expect(me.cacheControl, "the session endpoint must never be cached").toContain("no-store");

  const session = JSON.parse(me.body);
  expect(session.user?.email, "the endpoint should report the signed-in user").toBe(email);
  // Only what the header draws. A field that is not sent cannot be read back
  // out of a browser cache or an extension.
  expect(Object.keys(session.user)).not.toContain("emailVerifiedAt");
  expect(Object.keys(session.user)).not.toContain("institutionId");

  // The cached pages, fetched *with* the session cookie, must be identity-free.
  for (const path of ["/", "/about", "/faq", "/events"]) {
    const response = await fetchInPage(path);
    expect(response.status, path).toBe(200);
    expect(response.body, `${path} must not contain the signed-in name`).not.toContain(
      CANARY_NAME,
    );
    expect(response.body, `${path} must not contain the signed-in email`).not.toContain(email);
    // The signed-out affordance is what belongs in shared HTML.
    expect(response.body, `${path} should render the signed-out header`).toContain("Sign In");
  }

  // And the other direction: a visitor with no session must not be handed the
  // previous one's page out of the cache.
  const anonymous = await context.browser()!.newContext();
  try {
    for (const path of ["/", "/about"]) {
      const response = await anonymous.request.get(path);
      const html = await response.text();
      expect(html, `${path} must not leak the previous visitor`).not.toContain(CANARY_NAME);
    }
  } finally {
    await anonymous.close();
  }

  // Finally, the header still has to work. The name can only have arrived from
  // the client-side session fetch, because the HTML checked above lacked it.
  //
  // `toBeAttached`, not `toBeVisible`: the name sits in a `hidden sm:inline`
  // span and this suite runs a Pixel 7 viewport, so on mobile it is in the DOM
  // without being shown. Presence is what is under test.
  await page.goto("/about");
  await expect(page.getByText(CANARY_NAME).first()).toBeAttached({ timeout: 10_000 });
});
