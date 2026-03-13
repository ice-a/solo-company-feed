import Link from "next/link";
import { Post } from "@/types/post";
import { normalizeImageUrl } from "@/lib/normalize";

type Props = {
  post: Post;
};

export function PostCard({ post }: Props) {
  const coverUrl = normalizeImageUrl(post.cover);
  return (
    <article className="group rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href={`/p/${post.slug}`}
            className="block text-lg font-semibold text-slate-900 transition group-hover:text-brand-600"
          >
            {post.title}
          </Link>
          <p className="text-sm text-slate-500">
            {new Date(post.createdAt).toLocaleString("zh-CN", { hour12: false })}
          </p>
        </div>
        {coverUrl ? (
          <Link href={`/p/${post.slug}`} className="shrink-0">
            <img
              src={coverUrl}
              alt={post.title}
              className="h-16 w-24 rounded-xl object-cover ring-1 ring-slate-100"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </Link>
        ) : null}
      </div>
      {post.tags && post.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}
