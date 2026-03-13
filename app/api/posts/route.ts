import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { z } from "zod";
import { generateSlug } from "@/lib/slug";

const postSchema = z.object({
  title: z.string().min(2).max(80),
  markdown: z.string().min(5),
  cover: z.string().url().optional(),
  tags: z.array(z.string().trim()).optional(),
  author: z.string().default("admin")
});

export async function GET() {
  const db = await getDb();
  const posts = await db
    .collection("posts")
    .find({}, { projection: { markdown: 0 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json(
    posts.map((p) => ({
      ...p,
      _id: p._id?.toString()
    }))
  );
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const now = new Date().toISOString();
  let slug = generateSlug();
  const db = await getDb();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const exists = await db.collection("posts").findOne({ slug });
    if (!exists) break;
    slug = generateSlug();
  }
  const existsAfter = await db.collection("posts").findOne({ slug });
  if (existsAfter) {
    return NextResponse.json({ error: "Failed to allocate slug" }, { status: 500 });
  }

  const doc = {
    ...data,
    slug,
    createdAt: now,
    updatedAt: now,
    views: 0
  };

  await db.collection("posts").insertOne(doc);
  return NextResponse.json({ ok: true, slug });
}
