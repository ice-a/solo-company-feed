import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/FavoriteButton";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { SharePanel } from "@/components/SharePanel";
import { cookieName, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { canEditPost, serializePost } from "@/lib/posts";
import { normalizeImageUrl } from "@/lib/normalize";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

async function fetchPost(slug: string) {
  const db = await getDb();
  const doc = await db.collection("posts").findOne({ slug });
  if (!doc) {
    return null;
  }

  db.collection("posts").updateOne({ _id: doc._id }, { $inc: { views: 1 } }).catch(() => {});
  const favoriteCount = await db.collection("favorites").countDocuments({ postSlug: slug });
  return serializePost({ ...doc, views: (doc.views ?? 0) + 1, favoriteCount });
}

export default async function PostPage({ params }: Props) {
  const token = cookies().get(cookieName)?.value;
  const session = await verifySession(token);
  const post = await fetchPost(params.slug);
  if (!post) {
    notFound();
  }

  const db = await getDb();
  const isFavorited = session?.uid
    ? Boolean(await db.collection("favorites").findOne({ ownerId: session.uid, postSlug: post.slug }))
    : false;
  const canEdit = canEditPost(post, session);
  const coverUrl = normalizeImageUrl(post.cover);
  const shareUrl = `${getSiteUrl()}/p/${post.slug}`;

  return (
    <article className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {post.isPinned ? (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                  置顶
                </span>
              ) : null}
              <h1 className="text-2xl font-semibold text-slate-900">{post.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit ? (
              <Link
                href={`/admin/edit/${post.slug}`}
                className="rounded-full bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
              >
                编辑
              </Link>
            ) : null}
            <FavoriteButton
              slug={post.slug}
              initialFavorited={isFavorited}
              initialCount={post.favoriteCount ?? 0}
              canFavorite={Boolean(session?.uid)}
            />
            <SharePanel url={shareUrl} />
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {post.author || "匿名"} |{" "}
          {new Date(post.createdAt).toLocaleString("zh-CN", {
            hour12: false,
            timeZone: "Asia/Shanghai"
          })}
          {" · "}
          浏览 {post.views ?? 0}
          {" · "}
          收藏 {post.favoriteCount ?? 0}
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
