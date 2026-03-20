import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, cookieName } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/stats") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/posts") && req.method !== "GET";

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get(cookieName)?.value;
  const session = await verifySession(token);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/stats/:path*", "/api/admin/:path*", "/api/posts/:path*"]
};
