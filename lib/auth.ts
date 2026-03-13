import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required");
  }
  return secret;
}

export type SessionPayload = {
  role: "admin";
  iat: number;
};

async function hmacSha256(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Buffer.from(sig).toString("base64url");
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const secret = getSecret();
  const base = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = await hmacSha256(base, secret);
  return `${base}.${sig}`;
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  const secret = getSecret();
  const [base, sig] = token.split(".");
  if (!base || !sig) return null;
  const check = await hmacSha256(base, secret);
  if (check !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString());
    return payload;
  } catch {
    return null;
  }
}

export async function requireAdminFromRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return Boolean(await verifySession(token));
}

export function setAdminCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 30
  });
}

export const cookieName = COOKIE_NAME;
