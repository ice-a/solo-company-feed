import { getDb } from "@/lib/mongo";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { notFound } from "next/navigation";
import { normalizeImageUrl } from "@/lib/normalize";
import { Post } from "@/types/post";
import { SharePanel } from "@/components/SharePanel";
import { getSiteUrl } from "@/lib/site";
import { DEFAULT_OPC_SIGNAL } from "@/lib/opc";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

async function fetchPost(slug: string): Promise<Post | null> {
  const db = await getDb();
  const doc = await db.collection("posts").findOne({ slug });
  if (!doc) return null;
  // fire-and-forget view increment
  db.collection("posts").updateOne({ slug }, { $inc: { views: 1 } }).catch(() => {});
  return {
    _id: doc._id?.toString(),
    title: doc.title ?? "",
    slug: doc.slug ?? slug,
    markdown: doc.markdown ?? "",
    cover: doc.cover,
    tags: doc.tags ?? [],
    signal: doc.signal ?? DEFAULT_OPC_SIGNAL,
    author: doc.author ?? "佚名",
    createdAt: doc.createdAt ?? new Date().toISOString(),
    updatedAt: doc.updatedAt ?? doc.createdAt ?? new Date().toISOString(),
    views: doc.views ?? 0
  };
}

export default async function PostPage({ params }: Props) {
  const post = await fetchPost(params.slug);

  if (!post) {
    notFound();
  }
  const coverUrl = normalizeImageUrl(post.cover);
  const shareUrl = `${getSiteUrl()}/p/${post.slug}`;

  return (
    <article className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{post.title}</h1>
          <SharePanel url={shareUrl} />
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {post.author || "佚名"} · {new Date(post.createdAt).toLocaleString("zh-CN", { hour12: false })}
        </p>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="mt-3 w-full rounded-2xl object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>
      <MarkdownViewer markdown={post.markdown} />
    </article>
  );
}
