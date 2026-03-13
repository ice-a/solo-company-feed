import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { z } from "zod";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const db = await getDb();
  const post = await db.collection("posts").findOneAndUpdate(
    { slug: params.slug },
    { $inc: { views: 1 } },
    { returnDocument: "after" }
  );

  if (!post || !post.value) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...post.value,
    _id: (post.value._id as ObjectId)?.toString()
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    title: z.string().min(2).max(80).optional(),
    markdown: z.string().min(5).optional(),
    cover: z.string().url().nullable().optional(),
    tags: z.array(z.string().trim()).optional(),
    author: z.string().optional()
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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
  if (typeof data.author === "string") set.author = data.author;

  const update: Record<string, unknown> = { $set: set };
  if (Object.keys(unset).length > 0) update.$unset = unset;

  const db = await getDb();
  const result = await db.collection("posts").updateOne({ slug: params.slug }, update);
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { slug: string } }) {
  const db = await getDb();
  const result = await db.collection("posts").deleteOne({ slug: params.slug });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
