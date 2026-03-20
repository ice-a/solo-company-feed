import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookieName, isAdminName, resolveUserRole, signSession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { verifyPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    username: z.string().trim().min(2).max(32),
    password: z.string().min(6).max(128)
  });
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "用户名或密码格式不正确" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const db = await getDb();
  const user = await db.collection("users").findOne({ usernameLower: username.toLowerCase() });

  if (
    !user ||
    typeof user.passwordSalt !== "string" ||
    typeof user.passwordHash !== "string" ||
    !verifyPassword(password, user.passwordSalt, user.passwordHash)
  ) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const name = user.displayName || user.username || username;
  const storedRole = resolveUserRole(user.role);
  const role = storedRole || (isAdminName(user.username) || isAdminName(name) ? "admin" : "user");
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const token = await signSession({
    role,
    iat: Date.now(),
    exp,
    uid: user._id?.toString(),
    name,
    username: user.username || username
  });

  const res = NextResponse.json({ ok: true, name, role });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/"
  });
  return res;
}
