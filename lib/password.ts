import crypto from "crypto";

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";
const SALT_BYTES = 16;

export function hashPassword(password: string, salt?: string) {
  const realSalt = salt ?? crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = crypto.pbkdf2Sync(password, realSalt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { salt: realSalt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const next = hashPassword(password, salt).hash;
  const a = Buffer.from(next, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
