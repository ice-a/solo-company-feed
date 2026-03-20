import { getDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";

type TagItem = { _id: string; count: number };

export default async function TagsPage() {
  const db = await getDb();
  const tags = (await db
    .collection("posts")
    .aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ])
    .toArray()) as TagItem[];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-semibold">标签</h1>
        <p className="mt-2 text-sm text-slate-500">所有访客都可以按标签浏览内容。</p>
      </div>

      {tags.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-4 text-sm text-slate-500 ring-1 ring-slate-100">暂无标签。</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <a
              key={tag._id}
              href={`/tags/${encodeURIComponent(tag._id)}`}
              className="rounded-full bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:text-brand-600"
            >
              #{tag._id} <span className="text-xs text-slate-400">({tag.count})</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
