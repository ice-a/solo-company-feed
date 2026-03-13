import { getDb } from "@/lib/mongo";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { notFound } from "next/navigation";
import { normalizeImageUrl } from "@/lib/normalize";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

async function fetchPost(slug: string) {
  const db = await getDb();
  const doc = await db.collection("posts").findOne({ slug });
  if (!doc) return null;
  // fire-and-forget view increment
  db.collection("posts").updateOne({ slug }, { $inc: { views: 1 } }).catch(() => {});
  return {
    ...doc,
    _id: doc._id?.toString()
  };
}

export default async function PostPage({ params }: Props) {
  const post = await fetchPost(params.slug);

  if (!post) {
    notFound();
  }
  const coverUrl = normalizeImageUrl(post.cover);

  return (
    <article className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">{post.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {new Date(post.createdAt).toLocaleString("zh-CN", { hour12: false })}
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
