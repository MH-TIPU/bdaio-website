import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // `@/…` comes from tsconfig, so the paths cannot drift from the app's.
    tsconfigPaths: true,
    alias: {
      // `server-only` throws unless it is resolved under React's `react-server`
      // condition, which Vitest does not set. Stubbing it lets a test import a
      // server module directly; the guard still does its job in the real build,
      // which is the only place it matters.
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});
