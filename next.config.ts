import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phase 0: moved off static export (`output: "export"`) to a full Node server
  // so the platform can do auth, a database, and per-user pages. `standalone`
  // emits a self-contained server bundle for deployment behind pm2 + nginx.
  output: "standalone",
  // Image optimization is now enabled (previously `unoptimized: true` for the
  // static export). Local assets under /public are same-origin and optimized
  // at runtime; add `images.remotePatterns` here when we serve remote images.
  experimental: {
    serverActions: {
      // Server Actions cap request bodies at 1MB by default, which is smaller
      // than things we accept: profile photos (1MB) and, since Phase 7b, answer
      // submissions (5MB). The envelope has to clear the largest of those plus
      // form overhead.
      //
      // Raising it does not loosen either rule — both limits are enforced in the
      // action, against the actual file size, so this only decides how large a
      // request is *read* before being rejected.
      bodySizeLimit: "6mb",
    },
  },
  // Phase 7 hardening. HSTS is deliberately absent: TLS terminates at nginx, and
  // Strict-Transport-Security belongs on the server that owns the certificate
  // (see docs/OPS.md) — sending it from Node would make it depend on a deploy.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Stops a browser from second-guessing a Content-Type — the reason a
          // renamed script uploaded as an "image" cannot execute.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No part of this app is meant to be framed, and the admin console
          // holds one-click destructive actions worth clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
          // Send the full URL only to ourselves; other origins get the origin.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // We ask for none of these, so no embedded frame can either.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
      {
        // The service worker must never be served from cache, or a bad worker
        // stays installed until its own cache entry expires.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
