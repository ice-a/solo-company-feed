import { getDb } from "@/lib/mongo";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*]\([^)]+\)/g, "$1")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const db = await getDb();
  const posts = await db
    .collection("posts")
    .find({}, { projection: { title: 1, slug: 1, markdown: 1, createdAt: 1, updatedAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const siteUrl = getSiteUrl();
  const now = new Date().toUTCString();

  const items = posts
    .map((post: any) => {
      const link = `${siteUrl}/p/${post.slug}`;
      const description = stripMarkdown(post.markdown || "").slice(0, 200);
      const pubDate = new Date(post.createdAt || post.updatedAt || Date.now()).toUTCString();
      return [
        "<item>",
        `<title>${escapeXml(post.title || "Untitled")}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid>${escapeXml(link)}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<description>${escapeXml(description)}</description>`,
        "</item>"
      ].join("");
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>不务正业的木子</title>
<link>${escapeXml(siteUrl)}</link>
<description>less is more</description>
<lastBuildDate>${now}</lastBuildDate>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
