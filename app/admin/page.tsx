import { cookies } from "next/headers";
import { AdminPostList } from "@/components/AdminPostList";
import { AdminUserManager } from "@/components/AdminUserManager";
import { CreatePostForm } from "@/components/CreatePostForm";
import { cookieName, isAdminSession, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { buildOwnedPostFilter, buildPinnedSort, serializePost } from "@/lib/posts";
import { findUserById, getEffectiveDailyPostLimit, getShanghaiDayRange } from "@/lib/users";
import { Post } from "@/types/post";

export const dynamic = "force-dynamic";

type ManagedUser = {
  id: string;
  username: string;
  displayName: string;
  role: "user" | "sponsor" | "admin";
  dailyPostLimit: number;
  postCount: number;
  todayPostCount: number;
  posts: Array<{ slug: string; title: string; createdAt: string; isPinned?: boolean }>;
};

const ROLE_LABELS: Record<ManagedUser["role"], string> = {
  user: "普通",
  sponsor: "赞助",
  admin: "管理员"
};

async function fetchRecentPosts(session: Awaited<ReturnType<typeof verifySession>>) {
  const db = await getDb();
  const posts = await db
    .collection("posts")
    .find(buildOwnedPostFilter(session), { projection: { markdown: 0 } })
    .sort(buildPinnedSort())
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

async function fetchFavoritePosts(session: Awaited<ReturnType<typeof verifySession>>): Promise<Post[]> {
  if (!session?.uid) {
    return [];
  }

  const db = await getDb();
  const favorites = await db
    .collection("favorites")
    .find({ ownerId: session.uid }, { projection: { postSlug: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  const slugs = favorites.map((item: any) => item.postSlug).filter(Boolean);
  if (slugs.length === 0) {
    return [];
  }

  const posts = await db
    .collection("posts")
    .find({ slug: { $in: slugs } }, { projection: { markdown: 0 } })
    .toArray();

  const postMap = new Map(posts.map((post: any) => [post.slug, serializePost(post)]));
  return slugs.map((slug) => postMap.get(slug)).filter(Boolean) as Post[];
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
    .find(
      {},
      {
        projection: {
          slug: 1,
          title: 1,
          createdAt: 1,
          ownerId: 1,
          author: 1,
          isPinned: 1
        }
      }
    )
    .sort(buildPinnedSort())
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
  const postsByOwner = new Map<
    string,
    Array<{ slug: string; title: string; createdAt: string; isPinned?: boolean }>
  >();

  posts.forEach((post: any) => {
    const resolvedOwnerId =
      post.ownerId || authorToUserId.get(String(post.author || "").trim().toLowerCase());
    if (!resolvedOwnerId) return;

    const list = postsByOwner.get(resolvedOwnerId) ?? [];
    list.push({
      slug: post.slug,
      title: post.title ?? "未命名",
      createdAt: post.createdAt ?? new Date().toISOString(),
      isPinned: Boolean(post.isPinned)
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
        role:
          user.role === "admin" || user.role === "sponsor" || user.role === "user"
            ? user.role
            : "user",
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
  const roleLabel = ROLE_LABELS[(session?.role as ManagedUser["role"]) || "user"];

  const [recentPosts, favoritePosts, availableTags, publishQuota, managedUsers] = await Promise.all([
    fetchRecentPosts(session),
    fetchFavoritePosts(session),
    fetchAvailableTags(session),
    fetchPublishQuota(session),
    adminView ? fetchManagedUsers() : Promise.resolve([] as ManagedUser[])
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">内容后台</h1>
            <p className="text-sm text-slate-500">
              登录用户可以发布、编辑自己的内容和管理自己的收藏；管理员额外拥有置顶、删帖、删用户和调整用户等级/额度的全部权限。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200">
              {session?.name || "未登录"} · {roleLabel}
            </span>
            <a
              href="/stats"
              className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
            >
              查看统计
            </a>
          </div>
        </div>
      </section>

      <CreatePostForm
        availableTags={availableTags}
        publishLimit={publishQuota.limit}
        todayCount={publishQuota.todayCount}
      />

      <AdminPostList
        initialPosts={recentPosts}
        title="我的内容"
        description="你只能编辑自己的内容；管理员可在这里快速置顶或删除自己的内容。"
        canDelete={adminView}
        canPin={adminView}
      />

      <AdminPostList
        initialPosts={favoritePosts}
        title="我的收藏"
        description="收藏仅自己可见，方便回看喜欢的内容。"
        emptyText="你还没有收藏任何内容。"
        showEdit={false}
      />

      {adminView ? <AdminUserManager initialUsers={managedUsers} currentUserId={session?.uid || ""} /> : null}
    </div>
  );
}
