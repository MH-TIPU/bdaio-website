/**
 * Performance budget, measured the way a participant would experience the site.
 *
 * `/admin/analytics` already collects Core Web Vitals from real visitors, but
 * that only tells us a deploy hurt after people have suffered it. This is the
 * lab half: it runs on every pull request and fails before the regression ships.
 *
 * **Throttling is the point.** The defaults here emulate a mid-range phone on a
 * slow connection, not a laptop on fibre — which is what most of our entrants
 * are holding. A page that feels instant in Dhaka on office wifi can take eight
 * seconds on a student's phone in Rajshahi, and nothing else in the pipeline
 * would tell us.
 *
 * The numbers below are set a little above what the site measures today (see
 * §13.3 of docs/PLATFORM_PLAN.md for the baseline), so this is a ratchet against
 * regressions rather than an aspiration that fails on day one. Tighten them when
 * a page improves; do not loosen them to make a build pass.
 */
const PORT = process.env.LHCI_PORT || 3100;
const base = `http://127.0.0.1:${PORT}`;

module.exports = {
  ci: {
    collect: {
      // The production build, served the way OPS.md serves it. `next dev` would
      // measure unminified bundles with hot-reload machinery attached, which
      // tells us nothing about what a participant downloads.
      startServerCommand: "npm run start:standalone",
      startServerReadyPattern: "Ready|started server",
      startServerReadyTimeout: 120_000,
      // Canonical un-prefixed URLs. Measuring a legacy `/en/*` path would time
      // the 301 as well as the page, which is not what a visitor pays.
      url: [
        `${base}/`, // the busiest page, and the one with the hero image
        `${base}/events`, // a database-backed list
        `${base}/register`, // the top of the critical path
      ],
      // Three runs and take the median: a single run on a shared CI box swings
      // enough to fail a budget for no reason.
      numberOfRuns: 3,
      settings: {
        // Explicit rather than implied, so a Lighthouse default changing under
        // us cannot quietly move the goalposts.
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        throttlingMethod: "simulate",
        throttling: {
          // Roughly a congested 4G link: what a phone on mobile data gets here,
          // not what a fibre connection in a European datacentre gets.
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
      },
    },

    assert: {
      assertions: {
        // --- Categories ------------------------------------------------------
        "categories:performance": ["error", { minScore: 0.75 }],
        "categories:accessibility": ["error", { minScore: 0.98 }],
        "categories:seo": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],

        // --- The metrics people actually feel --------------------------------
        "first-contentful-paint": ["error", { maxNumericValue: 1800 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 5500 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "speed-index": ["error", { maxNumericValue: 5000 }],

        // --- Weight, which is what costs a participant money -----------------
        "resource-summary:script:size": ["error", { maxNumericValue: 260_000 }],
        "resource-summary:image:size": ["error", { maxNumericValue: 300_000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 750_000 }],

        // Audits that are noisy in CI or not meaningful on a local server.
        "uses-long-cache-ttl": "off",
        "unused-javascript": "off",
        "legacy-javascript": "off",
        "csp-xss": "off",
        "is-on-https": "off",
        redirects: "off",
      },
    },

    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
