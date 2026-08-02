import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests: the pages, not the server.
 *
 * The Vitest integration project already calls the server actions directly, so
 * what is left to prove here is the part it cannot see — that the forms are
 * wired to those actions, that navigation works, and that the pages are usable
 * with a keyboard and a screen reader.
 *
 * Runs against a **production build** rather than `next dev`: dev serves
 * unminified bundles with hot-reload machinery attached, so anything measured
 * there says nothing about what a participant downloads.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // These share one database and register the same accounts, so they cannot run
  // beside each other.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL,
    trace: "on-first-retry",
    // What most participants are holding, not what we develop on.
    ...devices["Pixel 7"],
  },

  webServer: {
    // `next start` refuses an `output: "standalone"` build, and the standalone
    // bundle does not carry its own static assets — the copy is the same one
    // docs/OPS.md §4 does on every deploy, so this runs what production runs.
    command: "npm run start:standalone",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      // The same guard as the Vitest integration project: these tests write
      // real rows, so they must never point at a development database.
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      APP_URL: baseURL,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret-not-used-for-anything-real",
      NODE_ENV: "production",
    },
  },
});
