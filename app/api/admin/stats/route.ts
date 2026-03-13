import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function GET() {
  const db = await getDb();
  const collection = db.collection("posts");
  const total = await collection.countDocuments();
  const latest = await collection.find({}, { projection: { title: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(1).toArray();
  const top = await collection.find({}, { projection: { title: 1, views: 1, slug: 1 } }).sort({ views: -1 }).limit(3).toArray();

  return NextResponse.json({
    total,
    latest: latest[0] || null,
    top
  });
}
