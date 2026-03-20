import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookieName, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { OPC_SIGNAL_VALUES } from "@/lib/opc";
import { canDeletePost, canEditPost, serializePost } from "@/lib/posts";

async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  return verifySession(token);
}

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const db = await getDb();
  const post = await db.collection("posts").findOne({ slug: params.slug });

  if (!post) {
    return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  }

  await db.collection("posts").updateOne({ _id: post._id }, { $inc: { views: 1 } });
  return NextResponse.json(serializePost({ ...post, views: (post.views ?? 0) + 1 }));
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSessionFromRequest(req);
  const db = await getDb();
  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    title: z.string().min(2).max(80).optional(),
    markdown: z.string().min(5).optional(),
    cover: z.string().url().nullable().optional(),
    tags: z.array(z.string().trim()).optional(),
    signal: z.enum(OPC_SIGNAL_VALUES).optional()
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingPost = await db.collection("posts").findOne({ slug: params.slug });
  if (!existingPost) {
    return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  }
  if (!canEditPost(existingPost, session)) {
    return NextResponse.json({ error: "只能修改自己发布的内容" }, { status: 403 });
  }

  const data = parsed.data;
  const set: Record<string, unknown> = {
    updatedAt: new Date().toISOString()
  };
  const unset: Record<string, unknown> = {};

  if (typeof data.title === "string") set.title = data.title;
  if (typeof data.markdown === "string") set.markdown = data.markdown;
  if (data.cover === null) {
    unset.cover = "";
  } else if (typeof data.cover === "string") {
    set.cover = data.cover;
  }
  if (Array.isArray(data.tags)) set.tags = data.tags;
  if (typeof data.signal === "string") set.signal = data.signal;

  const update: Record<string, unknown> = { $set: set };
  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  await db.collection("posts").updateOne({ _id: existingPost._id }, update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSessionFromRequest(req);
  const db = await getDb();
  const existingPost = await db.collection("posts").findOne({ slug: params.slug });

  if (!existingPost) {
    return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  }
  if (!canDeletePost(existingPost, session)) {
    return NextResponse.json({ error: "只有管理员可以删除内容" }, { status: 403 });
  }

  await db.collection("posts").deleteOne({ _id: existingPost._id });
  await db.collection("favorites").deleteMany({ postSlug: params.slug });
  return NextResponse.json({ ok: true });
}
