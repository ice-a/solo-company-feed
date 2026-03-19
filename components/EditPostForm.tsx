"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeImageUrl } from "@/lib/normalize";
import { Post } from "@/types/post";
import { MarkdownPreview } from "@/components/MarkdownPreview";

export function EditPostForm({ post }: { post: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [cover, setCover] = useState(post.cover || "");
  const [tags, setTags] = useState(post.tags ? post.tags.join(", ") : "");
  const [markdown, setMarkdown] = useState(post.markdown);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedCover = normalizeImageUrl(cover);
      const res = await fetch(`/api/posts/${post.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          markdown,
          cover: normalizedCover || null,
          tags: Array.from(
            new Set(
              tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            )
          )
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ? JSON.stringify(data.error) : "保存失败");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("确定要删除这条内容吗？此操作不可恢复。")) return;
    const res = await fetch(`/api/posts/${post.slug}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "删除失败");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">编辑内容</h3>
          <p className="text-sm text-slate-500">更新信息流内容与标签。</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-100"
          >
            删除
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">标题</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">封面图片 URL（可选）</span>
        <input
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
          placeholder="https://img.020417.xyz/xxxx.png"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">标签（逗号分隔）</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
          placeholder="产品, 交付, 复盘"
        />
      </label>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Markdown 内容</span>
          <button
            type="button"
            onClick={() => setPreview((prev) => !prev)}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:text-brand-600"
          >
            {preview ? "编辑" : "预览"}
          </button>
        </div>
        {!preview ? (
          <textarea
            required
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <MarkdownPreview markdown={markdown || "(暂无内容)"} />
          </div>
        )}
      </div>
    </form>
  );
}
