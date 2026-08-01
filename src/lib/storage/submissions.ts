import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage for entrants' answer files.
 *
 * **These do not live under `UPLOAD_DIR`.** That directory is served directly by
 * nginx in production (§3.6), so anything inside it is public to whoever has the
 * URL. A random 32-hex filename makes a URL unguessable, but unguessable is not
 * access control for a student's exam answer — and once such a URL leaks it is
 * public forever. Submissions therefore go to a separate root that nginx must
 * never serve, and every read goes through a route handler that checks who is
 * asking.
 *
 * The other difference from avatars: we cannot re-encode these. A PDF or a
 * notebook has to be stored as received, so validation is by extension plus a
 * magic-byte check, and safety comes from how the file is *served* — always as an
 * attachment, never inline, with `nosniff` and a sandboxed CSP.
 */
export const SUBMISSION_ROOT = process.env.SUBMISSION_DIR
  ? path.resolve(process.env.SUBMISSION_DIR)
  : path.join(process.cwd(), "private-uploads", "submissions");

export const MAX_SUBMISSION_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * What an entrant may upload, and the byte signature we expect.
 *
 * `null` means "no reliable signature" — a CSV, a notebook and a Python file are
 * all just text, so there is nothing to check beyond the extension. That is
 * acceptable precisely because these files are never executed or rendered by us;
 * they are handed to a judge as a download.
 */
const ALLOWED_TYPES: Record<
  string,
  { mime: string; magic: Uint8Array[] | null }
> = {
  pdf: { mime: "application/pdf", magic: [new Uint8Array([0x25, 0x50, 0x44, 0x46])] }, // %PDF
  zip: {
    mime: "application/zip",
    // PK\x03\x04 for a normal archive, PK\x05\x06 for an empty one.
    magic: [
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    ],
  },
  csv: { mime: "text/csv", magic: null },
  txt: { mime: "text/plain", magic: null },
  ipynb: { mime: "application/x-ipynb+json", magic: null },
  py: { mime: "text/x-python", magic: null },
};

export const ALLOWED_SUBMISSION_EXTENSIONS = Object.keys(ALLOWED_TYPES);

export type SubmissionSaveResult =
  | { ok: true; filename: string; mimeType: string; originalName: string; sizeBytes: number }
  | { ok: false; error: string };

/** The extension, lowercased and without the dot. */
function extensionOf(name: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name.trim());
  return match ? match[1].toLowerCase() : "";
}

/**
 * Trims a client filename down to something safe to echo back in a
 * `Content-Disposition` header and in the UI.
 *
 * It is never used as a path — the stored name is generated — but it *is* shown
 * to a judge and sent back as the download name, so path separators, control
 * characters and quotes all have to go.
 */
export function safeOriginalName(name: string, extension: string): string {
  const base = name
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    // Control characters would let a CR/LF into the Content-Disposition
    // header; quotes and semicolons would break out of its filename
    // parameter. Written as escapes, not literal bytes.
    .replace(/[\u0000-\u001f\u007f"';]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const withoutExt = base.replace(/\.[a-zA-Z0-9]+$/, "").slice(0, 80);
  return `${withoutExt || "submission"}.${extension}`;
}

function startsWithAny(bytes: Uint8Array, signatures: Uint8Array[]): boolean {
  return signatures.some(
    (sig) => bytes.length >= sig.length && sig.every((byte, i) => bytes[i] === byte),
  );
}

/** Validates and stores a submission file. */
export async function saveSubmission(file: File): Promise<SubmissionSaveResult> {
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  if (file.size > MAX_SUBMISSION_BYTES) {
    return { ok: false, error: "Files must be 5 MB or smaller." };
  }

  const extension = extensionOf(file.name);
  const type = ALLOWED_TYPES[extension];
  if (!type) {
    return {
      ok: false,
      error: `Use one of: ${ALLOWED_SUBMISSION_EXTENSIONS.join(", ")}.`,
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // A renamed executable with a .pdf extension fails here. Text formats have no
  // signature to check, which is why nothing we store is ever served inline.
  if (type.magic && !startsWithAny(bytes, type.magic)) {
    return {
      ok: false,
      error: `That file does not look like a ${extension.toUpperCase()} file.`,
    };
  }

  const filename = `${randomBytes(16).toString("hex")}.${extension}`;
  await mkdir(SUBMISSION_ROOT, { recursive: true });
  await writeFile(path.join(SUBMISSION_ROOT, filename), bytes);

  return {
    ok: true,
    filename,
    mimeType: type.mime,
    originalName: safeOriginalName(file.name, extension),
    sizeBytes: file.size,
  };
}

/** Absolute path of a stored submission, or null if the name is not one of ours. */
export function submissionPath(filename: string): string | null {
  if (!/^[a-f0-9]{32}\.[a-z0-9]{1,6}$/.test(filename)) return null;
  const absolute = path.resolve(SUBMISSION_ROOT, filename);
  // Belt and braces: the regex already forbids separators, but the resolved path
  // is re-checked so no future change to the pattern can open a traversal.
  return absolute === path.join(SUBMISSION_ROOT, filename) ? absolute : null;
}

/** Removes a stored submission; a missing file is not an error. */
export async function deleteSubmissionFile(filename: string | null | undefined) {
  if (!filename) return;
  const absolute = submissionPath(filename);
  if (!absolute) return;
  try {
    await unlink(absolute);
  } catch {
    // Already gone.
  }
}

/** "1.4 MB" — for showing a judge what they are about to download. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
