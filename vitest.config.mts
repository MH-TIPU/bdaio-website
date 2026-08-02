import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
  // `server-only` throws unless it is resolved under React's `react-server`
  // condition, which Vitest does not set. Stubbing it lets a test import a
  // server module directly; the guard still does its job in the real build,
  // which is the only place it matters.
  "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
};

export default defineConfig({
  // `@/…` comes from tsconfig, so the paths cannot drift from the app's.
  resolve: { tsconfigPaths: true, alias },
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true, alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/*.test.ts"],
          setupFiles: ["tests/setup.ts"],
        },
      },
      {
        resolve: { tsconfigPaths: true, alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/*.test.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          // These share one database and truncate it between cases, so they
          // cannot run beside each other. Serial within the project; the unit
          // project still runs in parallel with it.
          fileParallelism: false,
          sequence: { concurrent: false },
        },
      },
    ],
  },
});
