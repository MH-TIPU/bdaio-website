import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / vendored output — not ours to lint.
    "src/generated/**",
    "public/bdaio-site-static/**",
    "scripts/build-static.js",
    // Scratch worktrees left by coding agents. They contain copies of the repo,
    // so without this a bare `eslint` (which is what CI runs) reports the same
    // file several times over and fails on code that is not in the branch.
    ".claude/**",
  ]),
]);

export default eslintConfig;
