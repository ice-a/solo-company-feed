"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { normalizeImageUrl } from "@/lib/normalize";
import { Post } from "@/types/post";

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
                .map((item) => item.trim())
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

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">编辑内容</h3>
        <p className="text-sm text-slate-500">你只能修改自己发布的内容。</p>
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
        <span className="text-sm font-medium text-slate-700">封面地址（可选）</span>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700">正文</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreview((prev) => !prev)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:text-brand-600"
            >
              {preview ? "继续编辑" : "预览"}
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
            <MarkdownPreview markdown={markdown || "（空内容）"} />
          </div>
        )}
      </div>
    </form>
  );
}
