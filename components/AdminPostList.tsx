"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Post } from "@/types/post";

type AdminPost = Post & { createdAtText?: string };

export function AdminPostList({
  initialPosts,
  title = "最近内容",
  description,
  emptyText = "暂无内容。",
  canDelete = false,
  canPin = false,
  showEdit = true
}: {
  initialPosts: AdminPost[];
  title?: string;
  description?: string;
  emptyText?: string;
  canDelete?: boolean;
  canPin?: boolean;
  showEdit?: boolean;
}) {
  const [posts, setPosts] = useState<AdminPost[]>(initialPosts);
  const [tagQuery, setTagQuery] = useState("");
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const visiblePosts = useMemo(() => {
    const query = tagQuery.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) => post.tags?.some((tag) => tag.toLowerCase().includes(query)));
  }, [posts, tagQuery]);

  async function handleDelete(slug: string) {
    if (!window.confirm("确定要删除这条内容吗？此操作不可恢复。")) return;

    setBusySlug(slug);
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "删除失败");
        return;
      }

      setPosts((prev) => prev.filter((post) => post.slug !== slug));
    } finally {
      setBusySlug(null);
    }
  }

  async function handleTogglePin(post: AdminPost) {
    setBusySlug(post.slug);
    try {
      const res = await fetch(`/api/posts/${post.slug}/pin`, {
        method: post.isPinned ? "DELETE" : "POST"
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "置顶操作失败");
        return;
      }

      setPosts((prev) =>
        [...prev]
          .map((item) =>
            item.slug === post.slug
              ? {
                  ...item,
                  isPinned: Boolean(data.isPinned),
                  pinnedAt: data.pinnedAt
                }
              : item
          )
          .sort((a, b) => {
            const pinnedDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
            if (pinnedDiff !== 0) return pinnedDiff;
            const pinTimeDiff = (b.pinnedAt || "").localeCompare(a.pinnedAt || "");
            if (pinTimeDiff !== 0) return pinTimeDiff;
            return b.createdAt.localeCompare(a.createdAt);
          })
      );
    } finally {
      setBusySlug(null);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
        {emptyText}
      </div>
    );
  }

  const summary = tagQuery ? `匹配 ${visiblePosts.length} / 共 ${posts.length} 条` : `共 ${posts.length} 条`;

  return (
    <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          <p className="text-xs text-slate-400">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            placeholder="按标签搜索"
            className="w-40 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs shadow-inner focus:border-brand-500 focus:outline-none"
          />
          {tagQuery ? (
            <button
              type="button"
              onClick={() => setTagQuery("")}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200 hover:text-brand-600"
            >
              清除
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {visiblePosts.map((post) => (
          <div
            key={post.slug}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/70 p-3"
          >
            <div>
              {post.isPinned ? (
                <span className="mb-1 inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                  置顶
                </span>
              ) : null}
              <Link href={`/p/${post.slug}`} className="block font-medium text-slate-900 hover:text-brand-600">
                {post.title}
              </Link>
              <p className="text-xs text-slate-500">
                {(post.author || "匿名") +
                  " | " +
                  (post.createdAtText ||
                    new Date(post.createdAt).toLocaleString("zh-CN", {
                      hour12: false,
                      timeZone: "Asia/Shanghai"
                    }))}
              </p>
              {post.tags && post.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {showEdit ? (
                <Link
                  href={`/admin/edit/${post.slug}`}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
                >
                  编辑
                </Link>
              ) : null}
              {canPin ? (
                <button
                  type="button"
                  disabled={busySlug === post.slug}
                  onClick={() => handleTogglePin(post)}
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100 disabled:opacity-60"
                >
                  {post.isPinned ? "取消置顶" : "置顶"}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  disabled={busySlug === post.slug}
                  onClick={() => handleDelete(post.slug)}
                  className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-100 disabled:opacity-60"
                >
                  删除
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
