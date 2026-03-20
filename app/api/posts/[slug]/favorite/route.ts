import { NextRequest, NextResponse } from "next/server";
import { cookieName, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";

async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  return verifySession(token);
}

async function countFavorites(postSlug: string) {
  const db = await getDb();
  return db.collection("favorites").countDocuments({ postSlug });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session?.uid) {
    return NextResponse.json({ error: "请先登录后再收藏" }, { status: 401 });
  }

  const db = await getDb();
  const post = await db.collection("posts").findOne({ slug: params.slug }, { projection: { _id: 1 } });
  if (!post) {
    return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  }

  await db.collection("favorites").updateOne(
    { ownerId: session.uid, postSlug: params.slug },
    {
      $setOnInsert: {
        ownerId: session.uid,
        postSlug: params.slug,
        createdAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );

  return NextResponse.json({
    ok: true,
    isFavorited: true,
    favoriteCount: await countFavorites(params.slug)
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session?.uid) {
    return NextResponse.json({ error: "请先登录后再取消收藏" }, { status: 401 });
  }

  const db = await getDb();
  await db.collection("favorites").deleteOne({ ownerId: session.uid, postSlug: params.slug });

  return NextResponse.json({
    ok: true,
    isFavorited: false,
    favoriteCount: await countFavorites(params.slug)
  });
}
