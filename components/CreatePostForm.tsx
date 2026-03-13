"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeImageUrl } from "@/lib/normalize";

const defaultIntro = `## 新帖内容

- 这里支持 **Markdown**
- 图片请上传到 img.020417.xyz 后填入链接
`;

export function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState("");
  const [tags, setTags] = useState("");
  const [markdown, setMarkdown] = useState(defaultIntro);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">新建一条信息</h3>
          <p className="text-sm text-slate-500">填写后提交，立刻出现在首页最上方。</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "发布中…" : "发布"}
        </button>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">标题</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
          placeholder="比如：周末聚会安排"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">封面图（可选）</span>
        <input
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
          placeholder="https://img.020417.xyz/xxxx.png"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">标签（用逗号分隔，可选）</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
          placeholder="朋友, 聚会, 通知"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">正文（Markdown）</span>
        <textarea
          required
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          rows={12}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
        />
      </label>
    </form>
  );
}
