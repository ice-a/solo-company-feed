import { CreatePostForm } from "@/components/CreatePostForm";
import { AdminPostList } from "@/components/AdminPostList";
import { getDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";

async function fetchStats() {
  const db = await getDb();
  const collection = db.collection("posts");
  const total = await collection.countDocuments();
  const latest = await collection.find({}, { projection: { title: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(1).toArray();
  const top = await collection.find({}, { projection: { title: 1, views: 1, slug: 1 } }).sort({ views: -1 }).limit(3).toArray();

  return { total, latest: latest[0] || null, top };
}

async function fetchRecentPosts() {
  const db = await getDb();
  const posts = await db
    .collection("posts")
    .find({}, { projection: { markdown: 0 } })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
  return posts.map((p: any) => ({
    ...p,
    _id: p._id?.toString(),
    createdAtText: new Date(p.createdAt).toLocaleString("zh-CN", {
      hour12: false,
      timeZone: "Asia/Shanghai"
    })
  }));
}

export default async function AdminPage() {
  const stats = await fetchStats();
  const recentPosts = await fetchRecentPosts();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-500">累计发布</p>
          <p className="mt-1 text-3xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-500">最新一条</p>
          <p className="mt-1 text-base font-semibold">{stats.latest?.title ?? "暂无"}</p>
          <p className="text-xs text-slate-500">
            {stats.latest?.createdAt
              ? new Date(stats.latest.createdAt).toLocaleString("zh-CN", { hour12: false })
              : ""}
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-500">Top 热度</p>
          <ul className="mt-1 space-y-1 text-sm">
            {stats.top.map((item: any) => (
              <li key={item.slug} className="flex items-center justify-between">
                <span className="truncate">{item.title}</span>
                <span className="text-slate-500">{item.views ?? 0} 次</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CreatePostForm />

      <AdminPostList initialPosts={recentPosts} />
    </div>
  );
}
