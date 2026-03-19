import { CreatePostForm } from "@/components/CreatePostForm";
import { AdminPostList } from "@/components/AdminPostList";
import { getDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";

const cardClass =
  "rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 transition-[transform,box-shadow] duration-300 will-change-transform transform-gpu hover:shadow-lg hover:[transform:perspective(900px)_translateY(-4px)_rotateX(2deg)_rotateY(-2deg)]";

async function fetchStats() {
  const db = await getDb();
  const collection = db.collection("posts");
  const total = await collection.countDocuments();
  const latest = await collection
    .find({}, { projection: { title: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  const top = await collection
    .find({}, { projection: { title: 1, views: 1, slug: 1 } })
    .sort({ views: -1 })
    .limit(3)
    .toArray();
  const viewsAgg = await collection
    .aggregate([{ $group: { _id: null, totalViews: { $sum: { $ifNull: ["$views", 0] } } } }])
    .toArray();
  const totalViews = viewsAgg[0]?.totalViews ?? 0;
  const avgViews = total > 0 ? Math.round(totalViews / total) : 0;
  const tagCount = (await collection.distinct("tags")).filter(Boolean).length;
  const authorCount = (await collection.distinct("author")).filter(Boolean).length;

  return {
    total,
    latest: latest[0] || null,
    top,
    totalViews,
    avgViews,
    tagCount,
    authorCount
  };
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
    author: p.author ?? "佚名",
    createdAtText: new Date(p.createdAt).toLocaleString("zh-CN", {
      hour12: false,
      timeZone: "Asia/Shanghai"
    })
  }));
}

async function fetchAllTags() {
  const db = await getDb();
  const tags = await db
    .collection("posts")
    .aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ])
    .toArray();
  return tags.map((t: any) => t._id).filter(Boolean);
}

async function fetchTagStats() {
  const db = await getDb();
  const tags = await db
    .collection("posts")
    .aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 12 }
    ])
    .toArray();
  return tags.map((t: any) => ({ tag: t._id, count: t.count }));
}

async function fetchAuthorStats() {
  const db = await getDb();
  const authors = await db
    .collection("posts")
    .aggregate([
      { $group: { _id: { $ifNull: ["$author", "佚名"] }, count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 }
    ])
    .toArray();
  return authors.map((a: any) => ({ author: a._id, count: a.count }));
}

async function fetchDailyStats() {
  const db = await getDb();
  const now = new Date();
  const days: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    days.push({ key, label });
  }
  const since = `${days[0].key}T00:00:00.000Z`;
  const raw = await db
    .collection("posts")
    .aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $addFields: { day: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" } } } } },
      { $group: { _id: "$day", count: { $sum: 1 } } }
    ])
    .toArray();
  const map = new Map<string, number>();
  raw.forEach((item: any) => map.set(item._id, item.count));
  return days.map((d) => ({ label: d.label, count: map.get(d.key) ?? 0 }));
}

export default async function AdminPage() {
  const stats = await fetchStats();
  const recentPosts = await fetchRecentPosts();
  const availableTags = await fetchAllTags();
  const tagStats = await fetchTagStats();
  const authorStats = await fetchAuthorStats();
  const dailyStats = await fetchDailyStats();
  const tagMax = Math.max(...tagStats.map((t) => t.count), 1);
  const authorMax = Math.max(...authorStats.map((a) => a.count), 1);
  const dailyMax = Math.max(...dailyStats.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className={cardClass}>
          <p className="text-sm text-slate-500">总内容数</p>
          <p className="mt-1 text-3xl font-semibold">{stats.total}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-slate-500">最新发布</p>
          <p className="mt-1 text-base font-semibold">{stats.latest?.title ?? "暂无"}</p>
          <p className="text-xs text-slate-500">
            {stats.latest?.createdAt
              ? new Date(stats.latest.createdAt).toLocaleString("zh-CN", { hour12: false })
              : ""}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-slate-500">Top 阅读</p>
          <ul className="mt-1 space-y-1 text-sm">
            {stats.top.map((item: any) => (
              <li key={item.slug} className="flex items-center justify-between">
                <span className="truncate">{item.title}</span>
                <span className="text-slate-500">{item.views ?? 0} 阅读</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
        <h3 className="text-lg font-semibold">统计面板</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cardClass}>
            <p className="text-sm text-slate-500">总阅读</p>
            <p className="mt-1 text-2xl font-semibold">{stats.totalViews}</p>
          </div>
          <div className={cardClass}>
            <p className="text-sm text-slate-500">平均阅读</p>
            <p className="mt-1 text-2xl font-semibold">{stats.avgViews}</p>
          </div>
          <div className={cardClass}>
            <p className="text-sm text-slate-500">标签数量</p>
            <p className="mt-1 text-2xl font-semibold">{stats.tagCount}</p>
          </div>
          <div className={cardClass}>
            <p className="text-sm text-slate-500">作者数量</p>
            <p className="mt-1 text-2xl font-semibold">{stats.authorCount}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
            <h4 className="text-sm font-semibold text-slate-700">标签分布</h4>
            <div className="mt-3 space-y-3">
              {tagStats.length === 0 ? (
                <p className="text-xs text-slate-500">暂无标签数据</p>
              ) : (
                tagStats.map((item) => (
                  <div key={item.tag} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>#{item.tag}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-brand-500/80"
                        style={{ width: `${(item.count / tagMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
            <h4 className="text-sm font-semibold text-slate-700">作者分布</h4>
            <div className="mt-3 space-y-3">
              {authorStats.length === 0 ? (
                <p className="text-xs text-slate-500">暂无作者数据</p>
              ) : (
                authorStats.map((item) => (
                  <div key={item.author} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{item.author}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500/80"
                        style={{ width: `${(item.count / authorMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <h4 className="text-sm font-semibold text-slate-700">近 7 天发布</h4>
          <div className="mt-3 space-y-3">
            {dailyStats.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500/80"
                    style={{ width: `${(item.count / dailyMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CreatePostForm availableTags={availableTags} />

      <AdminPostList initialPosts={recentPosts} />
    </div>
  );
}
