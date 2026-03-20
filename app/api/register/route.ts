import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signSession, cookieName, isAdminName } from "@/lib/auth";
import { DEFAULT_DAILY_POST_LIMIT } from "@/lib/users";
import { getDb } from "@/lib/mongo";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    username: z.string().trim().min(2).max(32),
    password: z.string().min(6).max(128),
    displayName: z.string().trim().min(2).max(32).optional()
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "用户名或密码格式不正确" }, { status: 400 });
  }

  const { username, password, displayName } = parsed.data;
  const usernameLower = username.toLowerCase();
  const resolvedDisplayName = displayName || username;
  const role = isAdminName(username) || isAdminName(resolvedDisplayName) ? "admin" : "user";
  const db = await getDb();

  const exists = await db.collection("users").findOne({ usernameLower });
  if (exists) {
    return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const doc = {
    username,
    usernameLower,
    displayName: resolvedDisplayName,
    role,
    dailyPostLimit: DEFAULT_DAILY_POST_LIMIT,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now
  };

  const result = await db.collection("users").insertOne(doc);

  const name = doc.displayName;
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const token = await signSession({
    role,
    iat: Date.now(),
    exp,
    uid: result.insertedId?.toString(),
    name,
    username
  });
  const res = NextResponse.json({ ok: true, name });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/"
  });
  return res;
}
