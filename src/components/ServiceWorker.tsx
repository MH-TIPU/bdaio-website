"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js, which makes the site installable and gives it an
 * offline page.
 *
 * Only in production. A service worker sitting in front of the dev server
 * intercepts HMR requests and produces bugs that look like application bugs, so
 * in development this actively *unregisters* anything already installed — which
 * matters because localhost is a single origin shared by `next dev` and any
 * production build a developer has run there.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((r) => r.unregister()))
        .catch(() => undefined);
      return;
    }

    // Registration competes with page load for bandwidth; wait for idle.
    const register = () => {
      navigator.serviceWorker
        // `updateViaCache: "none"` stops the worker script itself from being
        // served from the HTTP cache, so a fix ships on the next visit.
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => undefined);
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
