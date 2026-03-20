"use client";

import { useState } from "react";
import { SocialLink } from "@/types/site";

function createDraftLink(index: number): SocialLink {
  return {
    id: `social-link-${Date.now()}-${index}`,
    label: "",
    url: "",
    iconUrl: ""
  };
}

export function SocialLinksManager({ initialLinks }: { initialLinks: SocialLink[] }) {
  const [links, setLinks] = useState<SocialLink[]>(initialLinks);
  const [saving, setSaving] = useState(false);

  function updateLink(id: string, key: keyof SocialLink, value: string) {
    setLinks((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function addLink() {
    setLinks((prev) => [...prev, createDraftLink(prev.length + 1)]);
  }

  function removeLink(id: string) {
    setLinks((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSave() {
    const sanitized = links
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        url: item.url.trim(),
        iconUrl: item.iconUrl?.trim() || ""
      }))
      .filter((item) => item.label || item.url || item.iconUrl);

    if (sanitized.some((item) => !item.label || !item.url)) {
      alert("每条社交链接都需要填写名称和地址。");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialLinks: sanitized })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "保存社交链接失败");
        return;
      }

      setLinks(data.socialLinks || sanitized);
      alert("社交链接已保存。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">首页社交链接</h3>
        <p className="text-sm text-slate-500">
          可配置首页顶部的 GitHub、B站等入口，也可以新增其他链接，并为每个入口自定义图标地址。
        </p>
      </div>

      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={link.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700">链接 {index + 1}</p>
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-100"
              >
                删除
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-500">名称</span>
                <input
                  value={link.label}
                  onChange={(e) => updateLink(link.id, "label", e.target.value)}
                  placeholder="例如：GitHub"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-500">链接地址</span>
                <input
                  value={link.url}
                  onChange={(e) => updateLink(link.id, "url", e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-500">图标地址</span>
                <input
                  value={link.iconUrl || ""}
                  onChange={(e) => updateLink(link.id, "iconUrl", e.target.value)}
                  placeholder="https://example.com/icon.png"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addLink}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:text-brand-600"
        >
          添加链接
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "保存中..." : "保存社交链接"}
        </button>
      </div>
    </section>
  );
}
