import { PostCard } from "@/components/PostCard";
import { getDb } from "@/lib/mongo";
import { serializePost } from "@/lib/posts";
import { buildSearchFilter } from "@/lib/search";
import { Post } from "@/types/post";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

async function fetchPosts(params: {
  tag?: string;
  q?: string;
  page: number;
}): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> {
  const db = await getDb();
  const filters: Record<string, unknown>[] = [];

  if (params.tag) {
    filters.push({ tags: params.tag });
  }

  const searchFilter = buildSearchFilter(params.q);
  if (searchFilter) {
    filters.push(searchFilter as Record<string, unknown>);
  }

  const filter = filters.length > 0 ? { $and: filters } : {};
  const total = await db.collection("posts").countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(params.page, 1), totalPages);
  const docs = await db
    .collection("posts")
    .find(filter, { projection: { markdown: 0 } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .toArray();

  return {
    posts: docs.map((doc: any) => serializePost(doc)),
    total,
    page,
    totalPages
  };
}

export default async function HomePage({
  searchParams
}: {
  searchParams?: { tag?: string; q?: string; page?: string };
}) {
  const tag = searchParams?.tag?.trim();
  const q = searchParams?.q?.trim();
  const page = Number.parseInt(searchParams?.page || "1", 10) || 1;
  const { posts, total, totalPages, page: currentPage } = await fetchPosts({ tag, q, page });

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  const clearSearchHref = (() => {
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  })();

  const clearTagHref = (() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  })();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-semibold">OPC Feed</h1>
        <p className="mt-2 text-sm text-white/80">
          未登录用户可以浏览全部内容；登录用户只能发布和修改自己的内容。
        </p>
        {tag ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <span>当前标签 #{tag}</span>
            <a
              href={clearTagHref}
              className="rounded-full bg-white/20 px-2 py-1 text-white/90 hover:bg-white/30"
            >
              清除标签
            </a>
          </div>
        ) : null}
      </div>

      <form
        action="/"
        method="get"
        className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100"
      >
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="搜索标题或内容"
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-700"
        >
          搜索
        </button>
        {q ? (
          <a href={clearSearchHref} className="text-sm text-slate-500 hover:text-brand-600">
            清除搜索
          </a>
        ) : null}
        <span className="text-xs text-slate-400">共 {total} 条</span>
      </form>

      {posts.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-4 text-sm text-slate-500 ring-1 ring-slate-100">暂无内容。</p>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          第 {currentPage} / {totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          <a
            href={buildHref(Math.max(1, currentPage - 1))}
            className={`rounded-full px-3 py-1 ${
              currentPage <= 1
                ? "pointer-events-none text-slate-300"
                : "bg-white/80 ring-1 ring-slate-200 hover:text-brand-600"
            }`}
          >
            上一页
          </a>
          <a
            href={buildHref(Math.min(totalPages, currentPage + 1))}
            className={`rounded-full px-3 py-1 ${
              currentPage >= totalPages
                ? "pointer-events-none text-slate-300"
                : "bg-white/80 ring-1 ring-slate-200 hover:text-brand-600"
            }`}
          >
            下一页
          </a>
        </div>
      </div>
    </div>
  );
}
