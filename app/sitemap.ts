import type { MetadataRoute } from "next";
import { getDb } from "@/lib/mongo";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb();
  const posts = await db
    .collection("posts")
    .find({}, { projection: { slug: 1, updatedAt: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();

  const siteUrl = getSiteUrl();
  const items: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date()
    }
  ];

  for (const post of posts) {
    items.push({
      url: `${siteUrl}/p/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.createdAt || Date.now())
    });
  }

  return items;
}
