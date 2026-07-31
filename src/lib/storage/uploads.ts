import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

/**
 * Local-disk storage for user uploads (the VPS runs everything itself).
 *
 * Files live OUTSIDE `public/` so nothing is served just because it exists —
 * reads go through a route handler in development, and nginx serves the same
 * directory directly in production.
 */
export const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

export const AVATAR_DIR = "avatars";
export const MAX_AVATAR_BYTES = 1024 * 1024; // 1 MB
const AVATAR_EDGE_PX = 512;

const ALLOWED_INPUT_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);

export type UploadResult =
  | { ok: true; filename: string }
  | { ok: false; error: string };

/**
 * Validates and stores a profile photo.
 *
 * The uploaded bytes are re-encoded with sharp rather than written through.
 * That single step: proves the file really is an image (a renamed script or
 * polyglot fails to decode), strips EXIF — including GPS coordinates, which
 * matters because most participants are minors — and bounds the stored size.
 */
export async function saveAvatar(file: File): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, error: "The file is empty." };
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Image must be 1 MB or smaller." };
  }

  const input = Buffer.from(await file.arrayBuffer());

  let pipeline: Sharp;
  let format: string | undefined;
  try {
    pipeline = sharp(input, { failOn: "error" });
    format = (await pipeline.metadata()).format;
  } catch {
    return { ok: false, error: "That file is not a readable image." };
  }

  if (!format || !ALLOWED_INPUT_FORMATS.has(format)) {
    return { ok: false, error: "Use a JPEG, PNG, or WebP image." };
  }

  // Re-encode: square-cropped, capped dimensions, metadata dropped by default.
  const output = await pipeline
    .rotate() // apply EXIF orientation before the data is discarded
    .resize(AVATAR_EDGE_PX, AVATAR_EDGE_PX, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toBuffer();

  // Server-generated name only — a client filename is never used in a path.
  const filename = `${randomBytes(16).toString("hex")}.webp`;
  const dir = path.join(UPLOAD_ROOT, AVATAR_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), output);

  return { ok: true, filename };
}

/** Removes a previously stored avatar; missing files are not an error. */
export async function deleteAvatar(filename: string | null | undefined) {
  if (!filename) return;
  // Defence in depth: reject anything that is not a bare generated filename.
  if (!/^[a-f0-9]{32}\.webp$/.test(filename)) return;
  try {
    await unlink(path.join(UPLOAD_ROOT, AVATAR_DIR, filename));
  } catch {
    // Already gone — nothing to do.
  }
}

/** Public URL for a stored avatar. */
export function avatarUrl(filename: string | null | undefined): string | null {
  return filename ? `/uploads/${AVATAR_DIR}/${filename}` : null;
}
