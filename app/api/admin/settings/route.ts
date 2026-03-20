import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookieName, isAdminSession, verifySession } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";

const socialLinkSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(30),
  url: z.string().trim().url(),
  iconUrl: z.string().trim().url().optional().or(z.literal(""))
});

const siteSettingsSchema = z.object({
  socialLinks: z.array(socialLinkSchema).max(20)
});

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  const session = await verifySession(token);
  if (!isAdminSession(session)) {
    return null;
  }
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await updateSiteSettings({
    socialLinks: parsed.data.socialLinks
  });

  return NextResponse.json({ ok: true, socialLinks: parsed.data.socialLinks });
}
