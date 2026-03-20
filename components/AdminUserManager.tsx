"use client";

import { useMemo, useState } from "react";

type ManagedPost = {
  slug: string;
  title: string;
  createdAt: string;
  isPinned?: boolean;
};

type ManagedUser = {
  id: string;
  username: string;
  displayName: string;
  role: "user" | "sponsor" | "admin";
  dailyPostLimit: number;
  postCount: number;
  todayPostCount: number;
  posts: ManagedPost[];
};

const ROLE_OPTIONS: Array<{ value: ManagedUser["role"]; label: string }> = [
  { value: "user", label: "普通" },
  { value: "sponsor", label: "赞助" },
  { value: "admin", label: "管理员" }
];

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

  async function handleTogglePin(userId: string, slug: string, isPinned: boolean) {
    const res = await fetch(`/api/posts/${slug}/pin`, {
      method: isPinned ? "DELETE" : "POST"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "置顶操作失败");
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id !== userId
          ? user
          : {
              ...user,
              posts: [...user.posts]
                .map((post) =>
                  post.slug === slug ? { ...post, isPinned: Boolean(data.isPinned) } : post
                )
                .sort((a, b) => {
                  const pinnedDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
                  if (pinnedDiff !== 0) return pinnedDiff;
                  return b.createdAt.localeCompare(a.createdAt);
                })
            }
      )
    );
  }

  async function handleSaveUser(
    userId: string,
    payload: { dailyPostLimit: number; role: ManagedUser["role"] }
  ) {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "保存失败");
        return;
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                dailyPostLimit: data.dailyPostLimit ?? payload.dailyPostLimit,
                role: data.role ?? payload.role
              }
            : user
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
          <p className="text-sm text-slate-500">
            可按用户名搜索，设置用户等级与每日发布额度，并删除用户或其指定内容。
          </p>
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
              onTogglePin={handleTogglePin}
              onDeleteUser={handleDeleteUser}
              onSaveUser={handleSaveUser}
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
  onTogglePin,
  onDeleteUser,
  onSaveUser
}: {
  user: ManagedUser;
  currentUserId: string;
  saving: boolean;
  onDeletePost: (slug: string) => Promise<void>;
  onTogglePin: (userId: string, slug: string, isPinned: boolean) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onSaveUser: (
    userId: string,
    payload: { dailyPostLimit: number; role: ManagedUser["role"] }
  ) => Promise<void>;
}) {
  const [limit, setLimit] = useState(user.dailyPostLimit);
  const [role, setRole] = useState<ManagedUser["role"]>(user.role);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-900">
            {user.displayName} <span className="text-sm font-normal text-slate-500">(@{user.username})</span>
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            角色：{ROLE_OPTIONS.find((item) => item.value === user.role)?.label || "普通"} | 总发布：
            {user.postCount} | 今日发布：{user.todayPostCount}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ManagedUser["role"])}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand-500 focus:outline-none"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            onClick={() => onSaveUser(user.id, { dailyPostLimit: limit, role })}
            className="rounded-full bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100 disabled:opacity-60"
          >
            保存设置
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
                {post.isPinned ? (
                  <span className="mb-1 inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                    置顶
                  </span>
                ) : null}
                <a href={`/p/${post.slug}`} className="block text-sm font-medium text-slate-900 hover:text-brand-600">
                  {post.title}
                </a>
                <p className="text-xs text-slate-500">
                  {new Date(post.createdAt).toLocaleString("zh-CN", {
                    hour12: false,
                    timeZone: "Asia/Shanghai"
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTogglePin(user.id, post.slug, Boolean(post.isPinned))}
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100"
                >
                  {post.isPinned ? "取消置顶" : "置顶"}
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePost(post.slug)}
                  className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-100"
                >
                  删除内容
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
