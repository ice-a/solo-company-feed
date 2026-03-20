import { cookies } from "next/headers";
import { AdminPostList } from "@/components/AdminPostList";
import { AdminUserManager } from "@/components/AdminUserManager";
import { CreatePostForm } from "@/components/CreatePostForm";
import { cookieName, isAdminSession, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { buildOwnedPostFilter, serializePost } from "@/lib/posts";
import { findUserById, getEffectiveDailyPostLimit, getShanghaiDayRange } from "@/lib/users";

export const dynamic = "force-dynamic";

type ManagedUser = {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
  dailyPostLimit: number;
  postCount: number;
  todayPostCount: number;
  posts: Array<{ slug: string; title: string; createdAt: string }>;
};

async function fetchRecentPosts(session: Awaited<ReturnType<typeof verifySession>>) {
  const db = await getDb();
  const posts = await db
    .collection("posts")
    .find(buildOwnedPostFilter(session), { projection: { markdown: 0 } })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return posts.map((post: any) => ({
    ...serializePost(post),
    createdAtText: new Date(post.createdAt).toLocaleString("zh-CN", {
      hour12: false,
      timeZone: "Asia/Shanghai"
    })
  }));
}

async function fetchAvailableTags(session: Awaited<ReturnType<typeof verifySession>>) {
  const db = await getDb();
  const tags = await db
    .collection("posts")
    .aggregate([
      { $match: buildOwnedPostFilter(session) },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ])
    .toArray();

  return tags.map((item: any) => item._id).filter(Boolean);
}

async function fetchPublishQuota(session: Awaited<ReturnType<typeof verifySession>>) {
  const user = await findUserById(session?.uid);
  const limit = getEffectiveDailyPostLimit(user || undefined);
  const { startIso, endIso } = getShanghaiDayRange();
  const todayCount = session?.uid
    ? await getDb().then((db) =>
        db.collection("posts").countDocuments({
          ownerId: session.uid,
          createdAt: { $gte: startIso, $lt: endIso }
        })
      )
    : 0;

  return { limit, todayCount };
}

async function fetchManagedUsers(): Promise<ManagedUser[]> {
  const db = await getDb();
  const { startIso, endIso } = getShanghaiDayRange();
  const users = await db
    .collection("users")
    .find(
      {},
      {
        projection: {
          username: 1,
          displayName: 1,
          role: 1,
          dailyPostLimit: 1
        }
      }
    )
    .sort({ createdAt: 1 })
    .toArray();

  const posts = await db
    .collection("posts")
    .find({}, { projection: { slug: 1, title: 1, createdAt: 1, ownerId: 1, author: 1 } })
    .sort({ createdAt: -1 })
    .toArray();

  const authorToUserId = new Map<string, string>();
  users.forEach((user: any) => {
    const id = user._id?.toString();
    if (!id) return;
    if (user.username) authorToUserId.set(String(user.username).trim().toLowerCase(), id);
    if (user.displayName) authorToUserId.set(String(user.displayName).trim().toLowerCase(), id);
  });

  const postCountMap = new Map<string, number>();
  const todayCountMap = new Map<string, number>();
  const postsByOwner = new Map<string, Array<{ slug: string; title: string; createdAt: string }>>();

  posts.forEach((post: any) => {
    const resolvedOwnerId =
      post.ownerId || authorToUserId.get(String(post.author || "").trim().toLowerCase());
    if (!resolvedOwnerId) return;

    const list = postsByOwner.get(resolvedOwnerId) ?? [];
    list.push({
      slug: post.slug,
      title: post.title ?? "未命名",
      createdAt: post.createdAt ?? new Date().toISOString()
    });
    postsByOwner.set(resolvedOwnerId, list);
    postCountMap.set(resolvedOwnerId, (postCountMap.get(resolvedOwnerId) ?? 0) + 1);

    if (post.createdAt >= startIso && post.createdAt < endIso) {
      todayCountMap.set(resolvedOwnerId, (todayCountMap.get(resolvedOwnerId) ?? 0) + 1);
    }
  });

  return users
    .map((user: any) => {
      const id = user._id?.toString();
      if (!id) return null;

      return {
        id,
        username: user.username ?? "",
        displayName: user.displayName ?? user.username ?? "",
        role: user.role === "admin" ? "admin" : "user",
        dailyPostLimit: getEffectiveDailyPostLimit(user),
        postCount: postCountMap.get(id) ?? 0,
        todayPostCount: todayCountMap.get(id) ?? 0,
        posts: postsByOwner.get(id) ?? []
      };
    })
    .filter(Boolean) as ManagedUser[];
}

export default async function AdminPage() {
  const token = cookies().get(cookieName)?.value;
  const session = await verifySession(token);
  const adminView = isAdminSession(session);

  const [recentPosts, availableTags, publishQuota, managedUsers] = await Promise.all([
    fetchRecentPosts(session),
    fetchAvailableTags(session),
    fetchPublishQuota(session),
    adminView ? fetchManagedUsers() : Promise.resolve([] as ManagedUser[])
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">内容后台</h1>
          <p className="text-sm text-slate-500">
            登录用户只能发布和修改自己的内容；删除内容、删除用户和设置发布额度仅管理员可操作。
          </p>
        </div>
      </section>

      <CreatePostForm
        availableTags={availableTags}
        publishLimit={publishQuota.limit}
        todayCount={publishQuota.todayCount}
      />

      <AdminPostList initialPosts={recentPosts} canDelete={false} />

      {adminView ? <AdminUserManager initialUsers={managedUsers} currentUserId={session?.uid || ""} /> : null}
    </div>
  );
}
