"use client";

import Link from "next/link";
import { useState } from "react";

type FavoriteButtonProps = {
  slug: string;
  initialFavorited: boolean;
  initialCount: number;
  canFavorite: boolean;
};

export function FavoriteButton({
  slug,
  initialFavorited,
  initialCount,
  canFavorite
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${slug}/favorite`, {
        method: favorited ? "DELETE" : "POST"
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "收藏操作失败");
        return;
      }

      setFavorited(Boolean(data.isFavorited));
      setCount(typeof data.favoriteCount === "number" ? data.favoriteCount : count);
    } finally {
      setLoading(false);
    }
  }

  if (!canFavorite) {
    return (
      <Link
        href={`/login?next=/p/${encodeURIComponent(slug)}`}
        className="rounded-full bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100"
      >
        登录后收藏
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-full px-3 py-2 text-sm font-medium ring-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${
        favorited
          ? "bg-rose-50 text-rose-700 ring-rose-100 hover:bg-rose-100"
          : "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200"
      }`}
    >
      {loading ? "处理中..." : `${favorited ? "已收藏" : "收藏"} · ${count}`}
    </button>
  );
}
