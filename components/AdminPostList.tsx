"use client";

import Link from "next/link";
import { useState } from "react";
import { Post } from "@/types/post";

type AdminPost = Post & { createdAtText?: string };

export function AdminPostList({ initialPosts }: { initialPosts: AdminPost[] }) {
  const [posts, setPosts] = useState<AdminPost[]>(initialPosts);

  async function handleDelete(slug: string) {
    if (!window.confirm("确定要删除这篇文章吗？此操作不可恢复。")) return;
    const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "删除失败");
      return;
    }
    setPosts((prev) => prev.filter((post) => post.slug !== slug));
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
        暂无文章。
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">最近发布</h3>
        <span className="text-xs text-slate-400">共 {posts.length} 条</span>
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.slug}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/70 p-3"
          >
            <div>
              <Link href={`/p/${post.slug}`} className="font-medium text-slate-900 hover:text-brand-600">
                {post.title}
              </Link>
              <p className="text-xs text-slate-500">
                {post.createdAtText ||
                  new Date(post.createdAt).toLocaleString("zh-CN", {
                    hour12: false,
                    timeZone: "Asia/Shanghai"
                  })}
              </p>
              {post.tags && post.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/edit/${post.slug}`}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
              >
                编辑
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(post.slug)}
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-100"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
