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
      // Server Actions cap request bodies at 1MB by default. Profile photos are
      // limited to 1MB, so the envelope must be a little larger to fit the image
      // plus the rest of the form. The 1MB image rule is enforced in the action.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
