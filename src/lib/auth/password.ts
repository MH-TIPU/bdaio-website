import "server-only";
import { hash, verify } from "@node-rs/argon2";

// Argon2id with parameters in line with OWASP guidance.
const OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, plain, OPTIONS);
  } catch {
    // A malformed or unsupported hash must never throw into the auth flow.
    return false;
  }
}
