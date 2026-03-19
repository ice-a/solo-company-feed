import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { hashPassword } from "@/lib/password";
import { signSession, cookieName } from "@/lib/auth";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    username: z.string().trim().min(2).max(32),
    password: z.string().min(6).max(128),
    displayName: z.string().trim().min(2).max(32).optional()
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "请填写有效的用户名与密码" }, { status: 400 });
  }

  const { username, password, displayName } = parsed.data;
  const usernameLower = username.toLowerCase();
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
    displayName: displayName || username,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now
  };

  const result = await db.collection("users").insertOne(doc);

  const name = doc.displayName;
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const token = await signSession({
    role: "admin",
    iat: Date.now(),
    exp,
    uid: result.insertedId?.toString(),
    name
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
