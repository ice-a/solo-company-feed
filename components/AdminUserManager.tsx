"use client";

import { useMemo, useState } from "react";

type ManagedPost = {
  slug: string;
  title: string;
  createdAt: string;
};

type ManagedUser = {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
  dailyPostLimit: number;
  postCount: number;
  todayPostCount: number;
  posts: ManagedPost[];
};

export function AdminUserManager({
  initialUsers,
  currentUserId
}: {
  initialUsers: ManagedUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const visibleUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(keyword) ||
        user.displayName.toLowerCase().includes(keyword)
    );
  }, [query, users]);

  async function handleDeletePost(slug: string) {
    if (!window.confirm("确定要删除这条内容吗？")) return;

    const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "删除失败");
      return;
    }

    setUsers((prev) =>
      prev.map((user) => {
        const target = user.posts.find((post) => post.slug === slug);
        if (!target) return user;
        return {
          ...user,
          postCount: Math.max(0, user.postCount - 1),
          todayPostCount:
            toShanghaiDateKey(target.createdAt) === toShanghaiDateKey(new Date().toISOString())
              ? Math.max(0, user.todayPostCount - 1)
              : user.todayPostCount,
          posts: user.posts.filter((post) => post.slug !== slug)
        };
      })
    );
  }

  async function handleSaveLimit(userId: string, dailyPostLimit: number) {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyPostLimit })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "保存失败");
        return;
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, dailyPostLimit: data.dailyPostLimit ?? dailyPostLimit } : user
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm("确定要删除该用户及其全部内容吗？")) return;

    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "删除失败");
      return;
    }

    setUsers((prev) => prev.filter((user) => user.id !== userId));
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">用户管理</h3>
          <p className="text-sm text-slate-500">按用户名搜索，删除指定内容、删除用户，并设置每日发布额度。</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索用户名"
          className="w-44 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="space-y-4">
        {visibleUsers.length === 0 ? (
          <p className="text-sm text-slate-500">没有匹配的用户。</p>
        ) : (
          visibleUsers.map((user) => (
            <AdminUserCard
              key={user.id}
              user={user}
              currentUserId={currentUserId}
              saving={savingId === user.id}
              onDeletePost={handleDeletePost}
              onDeleteUser={handleDeleteUser}
              onSaveLimit={handleSaveLimit}
            />
          ))
        )}
      </div>
    </section>
  );
}

function toShanghaiDateKey(input: string) {
  const date = new Date(input);
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function AdminUserCard({
  user,
  currentUserId,
  saving,
  onDeletePost,
  onDeleteUser,
  onSaveLimit
}: {
  user: ManagedUser;
  currentUserId: string;
  saving: boolean;
  onDeletePost: (slug: string) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onSaveLimit: (userId: string, dailyPostLimit: number) => Promise<void>;
}) {
  const [limit, setLimit] = useState(user.dailyPostLimit);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-900">
            {user.displayName} <span className="text-sm font-normal text-slate-500">(@{user.username})</span>
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            角色：{user.role === "admin" ? "管理员" : "用户"} | 总发布：{user.postCount} | 今日发布：{user.todayPostCount}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-24 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => onSaveLimit(user.id, limit)}
            className="rounded-full bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100 disabled:opacity-60"
          >
            保存额度
          </button>
          {user.id !== currentUserId ? (
            <button
              type="button"
              onClick={() => onDeleteUser(user.id)}
              className="rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-100"
            >
              删除用户
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {user.posts.length === 0 ? (
          <p className="text-sm text-slate-500">该用户暂无内容。</p>
        ) : (
          user.posts.map((post) => (
            <div
              key={post.slug}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
            >
              <div>
                <a href={`/p/${post.slug}`} className="text-sm font-medium text-slate-900 hover:text-brand-600">
                  {post.title}
                </a>
                <p className="text-xs text-slate-500">
                  {new Date(post.createdAt).toLocaleString("zh-CN", {
                    hour12: false,
                    timeZone: "Asia/Shanghai"
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDeletePost(post.slug)}
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-100"
              >
                删除内容
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
