import { NextRequest, NextResponse } from "next/server";
import { cookieName, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { canPinPost } from "@/lib/posts";

async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  return verifySession(token);
}

async function getPost(slug: string) {
  const db = await getDb();
  const post = await db.collection("posts").findOne({ slug });
  return { db, post };
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSessionFromRequest(req);
  const { db, post } = await getPost(params.slug);

  if (!post) {
    return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  }
  if (!canPinPost(post, session)) {
    return NextResponse.json({ error: "只有管理员可以置顶内容" }, { status: 403 });
  }

  const now = new Date().toISOString();
  await db.collection("posts").updateOne(
    { _id: post._id },
    { $set: { isPinned: true, pinnedAt: now, updatedAt: now } }
  );

  return NextResponse.json({ ok: true, isPinned: true, pinnedAt: now });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSessionFromRequest(req);
  const { db, post } = await getPost(params.slug);

  if (!post) {
    return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  }
  if (!canPinPost(post, session)) {
    return NextResponse.json({ error: "只有管理员可以取消置顶" }, { status: 403 });
  }

  const now = new Date().toISOString();
  await db.collection("posts").updateOne(
    { _id: post._id },
    { $set: { isPinned: false, updatedAt: now }, $unset: { pinnedAt: "" } }
  );

  return NextResponse.json({ ok: true, isPinned: false });
}
