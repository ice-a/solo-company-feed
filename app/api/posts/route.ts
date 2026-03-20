import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookieName, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { DEFAULT_OPC_SIGNAL, OPC_SIGNAL_VALUES } from "@/lib/opc";
import { buildPinnedSort, serializePost } from "@/lib/posts";
import { generateSlug } from "@/lib/slug";
import { findUserById, getEffectiveDailyPostLimit, getShanghaiDayRange } from "@/lib/users";

const postSchema = z.object({
  title: z.string().min(2).max(80),
  markdown: z.string().min(5),
  cover: z.string().url().optional(),
  tags: z.array(z.string().trim()).optional(),
  signal: z.enum(OPC_SIGNAL_VALUES).default(DEFAULT_OPC_SIGNAL)
});

export async function GET() {
  const db = await getDb();
  const posts = await db
    .collection("posts")
    .find({}, { projection: { markdown: 0 } })
    .sort(buildPinnedSort())
    .limit(50)
    .toArray();

  return NextResponse.json(posts.map((post) => serializePost(post)));
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const token = req.cookies.get(cookieName)?.value;
  const session = await verifySession(token);
  if (!session?.uid) {
    return NextResponse.json({ error: "请先登录后再发布" }, { status: 401 });
  }

  const user = await findUserById(session.uid);
  if (!user) {
    return NextResponse.json({ error: "用户不存在或已被删除" }, { status: 401 });
  }

  const limit = getEffectiveDailyPostLimit(user);
  const { startIso, endIso } = getShanghaiDayRange();
  const db = await getDb();
  const todayCount = await db.collection("posts").countDocuments({
    ownerId: session.uid,
    createdAt: { $gte: startIso, $lt: endIso }
  });
  if (todayCount >= limit) {
    return NextResponse.json({ error: `今日发布数量已达到上限（${limit}）` }, { status: 429 });
  }

  const data = parsed.data;
  const author = session.name ?? "匿名";
  const now = new Date().toISOString();
  let slug = generateSlug();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const exists = await db.collection("posts").findOne({ slug });
    if (!exists) break;
    slug = generateSlug();
  }

  const existsAfter = await db.collection("posts").findOne({ slug });
  if (existsAfter) {
    return NextResponse.json({ error: "生成内容标识失败" }, { status: 500 });
  }

  await db.collection("posts").insertOne({
    ...data,
    author,
    ownerId: session.uid,
    slug,
    createdAt: now,
    updatedAt: now,
    views: 0,
    isPinned: false
  });

  return NextResponse.json({ ok: true, slug, todayCount: todayCount + 1, limit });
}
