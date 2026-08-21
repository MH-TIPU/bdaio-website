/*
 * BdAIO service worker.
 *
 * Written by hand rather than generated: the usual choice (Serwist/next-pwa)
 * requires a custom webpack config, and Next 16 builds with Turbopack — adding
 * a webpack config breaks the build (docs/PLATFORM_PLAN.md §3.4).
 *
 * The one rule that shapes everything here: **HTML is never cached.** This app
 * serves per-user pages (dashboard, admin, results before publication) from the
 * same origin, and the cache storage is shared across the device profile. A
 * cached page would keep being served after sign-out, or to the next person to
 * pick up a shared phone. So navigations always go to the network, and the only
 * HTML in the cache is the static /offline page.
 *
 * What this buys on a flaky BD mobile connection: instant repeat loads of the
 * hashed JS/CSS/font bundles, and a branded offline page instead of the
 * browser's dinosaur.
 *
 * Bump CACHE_VERSION when this file changes; old caches are deleted on activate.
 * To disable the worker in an emergency, deploy this file containing only:
 *   self.addEventListener("install", () => self.registration.unregister());
 */

const CACHE_VERSION = "v3";
const ASSET_CACHE = `bdaio-assets-${CACHE_VERSION}`;
const SHELL_CACHE = `bdaio-shell-${CACHE_VERSION}`;

// A single offline page, at its canonical URL.
//
// Phase 7b precached one per locale (`/en/offline`, `/bn/offline`) because the
// public tree was prefixed. Both of those now 301 to `/offline`, and a *redirected*
// response cannot be handed to `respondWith` for a navigation — whose redirect mode
// is "manual" — so the fallback would have thrown and the reader would have got the
// bare 503 text instead of the branded page. CACHE_VERSION is bumped so installs
// still holding the prefixed entries drop them.
const OFFLINE_URL = "/offline";

/** Immutable, public, and safe to serve from the cache. */
const CACHEABLE_PREFIXES = ["/_next/static/", "/media/", "/icon-", "/og.png", "/apple-icon"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // `reload` bypasses the HTTP cache so a deploy can't leave a stale
      // offline page pinned for the life of the cache.
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([ASSET_CACHE, SHELL_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => !keep.has(name)).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

function isCacheableAsset(url) {
  if (url.origin !== self.location.origin) return false;

  // Images rendered by next/image are fetched through the optimizer, not from
  // their source path, so /media/… never appears as a request URL — without this
  // branch the logo is a broken image on the offline page.
  //
  // Optimized *uploads* are still excluded: a participant's photo is theirs, and
  // §3.6 keeps it out of shared storage on the device.
  if (url.pathname === "/_next/image") {
    return !(url.searchParams.get("url") ?? "").startsWith("/uploads");
  }

  return CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never touch anything that mutates state: Server Actions are POSTs to the
  // page's own URL, and replaying one from a cache would be a disaster.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Uploads (participant photos) and API responses stay uncached — the browser's
  // own HTTP cache already handles the immutable upload URLs.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkOnlyWithOfflinePage(request));
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/** Pages always come from the server; only the failure path is local. */
async function networkOnlyWithOfflinePage(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const offline = await cache.match(OFFLINE_URL);
    return (
      offline ??
      new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

/** Serve the cached copy immediately, refresh it in the background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) return cached;

  const fresh = await network;
  if (fresh) return fresh;

  // Offline with no exact match. next/image asks for whichever width fits the
  // viewport, so the cached copy is often the same picture at another size —
  // returning it beats a broken image in the header of the offline page. Only
  // reached once the network has already failed, so online loads still get the
  // width they asked for.
  const sameImage = await matchAnyWidth(cache, request);
  return sameImage ?? Response.error();
}

async function matchAnyWidth(cache, request) {
  const url = new URL(request.url);
  if (url.pathname !== "/_next/image") return undefined;

  const wanted = url.searchParams.get("url");
  for (const key of await cache.keys()) {
    const candidate = new URL(key.url);
    if (
      candidate.pathname === "/_next/image" &&
      candidate.searchParams.get("url") === wanted
    ) {
      return cache.match(key);
    }
  }
  return undefined;
}
