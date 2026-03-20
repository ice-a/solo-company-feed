import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { cookieName, isAdminSession, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { DEFAULT_DAILY_POST_LIMIT } from "@/lib/users";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  const session = await verifySession(token);
  if (!isAdminSession(session)) {
    return null;
  }
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  if (!ObjectId.isValid(params.userId)) {
    return NextResponse.json({ error: "用户 ID 无效" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    dailyPostLimit: z.number().int().min(0).max(1000)
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("users").updateOne(
    { _id: new ObjectId(params.userId) },
    { $set: { dailyPostLimit: parsed.data.dailyPostLimit } }
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    dailyPostLimit: parsed.data.dailyPostLimit ?? DEFAULT_DAILY_POST_LIMIT
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  if (!ObjectId.isValid(params.userId)) {
    return NextResponse.json({ error: "用户 ID 无效" }, { status: 400 });
  }
  if (session.uid === params.userId) {
    return NextResponse.json({ error: "不能删除当前登录的管理员账号" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(params.userId) });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  await db.collection("posts").deleteMany({
    $or: [
      { ownerId: params.userId },
      {
        $and: [
          { $or: [{ ownerId: { $exists: false } }, { ownerId: null }] },
          {
            author: {
              $in: [user.displayName, user.username].filter(Boolean)
            }
          }
        ]
      }
    ]
  });
  await db.collection("users").deleteOne({ _id: new ObjectId(params.userId) });

  return NextResponse.json({ ok: true });
}
