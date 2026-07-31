import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { ReadableOptions } from "node:stream";
import { UPLOAD_ROOT } from "@/lib/storage/uploads";

// Serves uploaded files from local disk in development and as a fallback.
// In production nginx should serve UPLOAD_DIR at /uploads directly, so these
// bytes never pass through Node.
//
// Only generated avatar filenames are accepted, and the resolved path is
// re-checked against UPLOAD_ROOT so traversal (`..`, encoded separators,
// symlink tricks) cannot escape the upload directory.

const ALLOWED = /^avatars\/[a-f0-9]{32}\.webp$/;

function toWebStream(nodePath: string, options?: ReadableOptions) {
  const nodeStream = createReadStream(nodePath, options);
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) =>
        controller.enqueue(new Uint8Array(chunk as Buffer)),
      );
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (error) => controller.error(error));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: segments } = await ctx.params;
  const relative = segments.join("/");

  if (!ALLOWED.test(relative)) {
    return new Response("Not found", { status: 404 });
  }

  const absolute = path.resolve(UPLOAD_ROOT, relative);
  if (absolute !== path.join(UPLOAD_ROOT, relative)) {
    return new Response("Not found", { status: 404 });
  }

  let size: number;
  try {
    const info = await stat(absolute);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    size = info.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  return new Response(toWebStream(absolute), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(size),
      // Filenames are content-addressed by randomness: a new upload gets a new
      // name, so responses can be cached hard.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
