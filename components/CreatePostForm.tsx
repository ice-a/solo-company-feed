"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeImageUrl } from "@/lib/normalize";
import { MarkdownPreview } from "@/components/MarkdownPreview";

const defaultIntro = `## solo-feed 记录模板

- 今日目标：
- 产品/交付：
- 客户/收入：
- 增长/运营：
- 学习/复盘：
`;

export function CreatePostForm({ availableTags = [] }: { availableTags?: string[] }) {
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState("");
  const [tags, setTags] = useState("");
  const [markdown, setMarkdown] = useState(defaultIntro);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const router = useRouter();

  const addTag = (tag: string) => {
    const current = new Set(
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    );
    current.add(tag);
    setTags(Array.from(current).join(", "));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedCover = normalizeImageUrl(cover);
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          markdown,
          cover: normalizedCover,
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
        alert(data.error ? JSON.stringify(data.error) : "发布失败");
      } else {
        const data = await res.json();
        router.push(`/p/${data.slug}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">发布新内容</h3>
          <p className="text-sm text-slate-500">以信息流的方式记录进展、沉淀经验。</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview((prev) => !prev)}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:text-brand-600"
          >
            {preview ? "编辑" : "预览"}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "发布中..." : "发布"}
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
          placeholder="例如：本周交付进展"
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
        {availableTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200 hover:text-brand-600"
              >
                #{tag}
              </button>
            ))}
          </div>
        ) : null}
      </label>

      <div className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Markdown 内容</span>
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
