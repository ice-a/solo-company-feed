import { NextRequest, NextResponse } from "next/server";
import { signSession, cookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = body.password as string | undefined;
  const target = process.env.ADMIN_PASS;

  if (!target) {
    return NextResponse.json({ error: "ADMIN_PASS is not set on server" }, { status: 500 });
  }

  if (!password || password !== target) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const token = await signSession({ role: "admin", iat: Date.now() });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });
  return res;
}
