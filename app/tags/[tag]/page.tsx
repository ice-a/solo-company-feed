import { getDb } from "@/lib/mongo";
import { PostCard } from "@/components/PostCard";
import { Post } from "@/types/post";
import { buildSearchFilter } from "@/lib/search";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

async function fetchTagPosts(params: {
  tag: string;
  q?: string;
  page: number;
}): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> {
  const db = await getDb();
  const filters: Record<string, unknown>[] = [{ tags: params.tag }];
  const searchFilter = buildSearchFilter(params.q);
  if (searchFilter) {
    filters.push(searchFilter as Record<string, unknown>);
  }
  const filter = { $and: filters };
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
    posts: docs.map((d: any) => ({
      ...d,
      author: d.author ?? "佚名",
      _id: d._id?.toString()
    })),
    total,
    page,
    totalPages
  };
}

export default async function TagDetailPage({
  params,
  searchParams
}: {
  params: { tag: string };
  searchParams?: { q?: string; page?: string };
}) {
  const tag = params.tag;
  const q = searchParams?.q?.trim();
  const page = Number.parseInt(searchParams?.page || "1", 10) || 1;
  const { posts, total, totalPages, page: currentPage } = await fetchTagPosts({ tag, q, page });

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/tags/${encodeURIComponent(tag)}?${qs}` : `/tags/${encodeURIComponent(tag)}`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-semibold">标签 · {tag}</h1>
        <p className="mt-2 text-sm text-slate-500">共 {total} 条内容</p>
      </div>

      <form
        action={`/tags/${encodeURIComponent(tag)}`}
        method="get"
        className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100"
      >
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="在当前标签内搜索"
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-700"
        >
          搜索
        </button>
        {q ? (
          <a
            href={`/tags/${encodeURIComponent(tag)}`}
            className="text-sm text-slate-500 hover:text-brand-600"
          >
            清除搜索
          </a>
        ) : null}
      </form>

      {posts.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-4 text-sm text-slate-500 ring-1 ring-slate-100">
          暂无内容。
        </p>
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
            className={`rounded-full px-3 py-1 ${currentPage <= 1 ? "pointer-events-none text-slate-300" : "bg-white/80 ring-1 ring-slate-200 hover:text-brand-600"}`}
          >
            上一页
          </a>
          <a
            href={buildHref(Math.min(totalPages, currentPage + 1))}
            className={`rounded-full px-3 py-1 ${currentPage >= totalPages ? "pointer-events-none text-slate-300" : "bg-white/80 ring-1 ring-slate-200 hover:text-brand-600"}`}
          >
            下一页
          </a>
        </div>
      </div>
    </div>
  );
}
