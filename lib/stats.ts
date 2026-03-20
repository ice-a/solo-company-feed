import { getDb } from "@/lib/mongo";

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

export type StatsSummary = {
  total: number;
  totalViews: number;
  avgViews: number;
  tagCount: number;
  authorCount: number;
  latest: { title: string; createdAt: string } | null;
  top: Array<{ title: string; slug: string; views: number }>;
};

function appendMatch(
  pipeline: Record<string, unknown>[],
  filter: Record<string, unknown>,
  extraMatch?: Record<string, unknown>
) {
  const matchFilters = [filter, extraMatch].filter(
    (item) => item && Object.keys(item).length > 0
  ) as Record<string, unknown>[];

  if (matchFilters.length === 1) {
    pipeline.push({ $match: matchFilters[0] });
  } else if (matchFilters.length > 1) {
    pipeline.push({ $match: { $and: matchFilters } });
  }
}

function toShanghaiDateKey(date: Date) {
  return new Date(date.getTime() + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10);
}

function buildShanghaiBucketLabel(key: string) {
  const [, month, day] = key.split("-").map(Number);
  return `${month}/${day}`;
}

export async function fetchStatsSummary(filter: Record<string, unknown>): Promise<StatsSummary> {
  const db = await getDb();
  const collection = db.collection("posts");
  const total = await collection.countDocuments(filter);
  const latest = await collection
    .find(filter, { projection: { title: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  const top = await collection
    .find(filter, { projection: { title: 1, views: 1, slug: 1 } })
    .sort({ views: -1, createdAt: -1 })
    .limit(3)
    .toArray();

  const viewsPipeline: Record<string, unknown>[] = [];
  appendMatch(viewsPipeline, filter);
  viewsPipeline.push({
    $group: {
      _id: null,
      totalViews: { $sum: { $ifNull: ["$views", 0] } }
    }
  });
  const viewsAgg = await collection.aggregate(viewsPipeline).toArray();
  const totalViews = viewsAgg[0]?.totalViews ?? 0;
  const avgViews = total > 0 ? Math.round(totalViews / total) : 0;

  const tagPipeline: Record<string, unknown>[] = [];
  appendMatch(tagPipeline, filter, {
    tags: { $exists: true, $ne: [] }
  });
  tagPipeline.push(
    { $unwind: "$tags" },
    { $group: { _id: "$tags" } },
    { $count: "count" }
  );
  const tagCount = (await collection.aggregate(tagPipeline).toArray())[0]?.count ?? 0;

  const authorPipeline: Record<string, unknown>[] = [];
  appendMatch(authorPipeline, filter);
  authorPipeline.push(
    {
      $group: {
        _id: { $ifNull: ["$author", "匿名"] }
      }
    },
    { $count: "count" }
  );
  const authorCount = (await collection.aggregate(authorPipeline).toArray())[0]?.count ?? 0;

  return {
    total,
    totalViews,
    avgViews,
    tagCount,
    authorCount,
    latest: latest[0]
      ? {
          title: latest[0].title ?? "未命名",
          createdAt: latest[0].createdAt ?? new Date().toISOString()
        }
      : null,
    top: top.map((item: any) => ({
      title: item.title ?? "未命名",
      slug: item.slug ?? "",
      views: item.views ?? 0
    }))
  };
}

export async function fetchTagStats(filter: Record<string, unknown>, limit = 10) {
  const db = await getDb();
  const pipeline: Record<string, unknown>[] = [];
  appendMatch(pipeline, filter, {
    tags: { $exists: true, $ne: [] }
  });
  pipeline.push(
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit }
  );

  const result = await db.collection("posts").aggregate(pipeline).toArray();
  return result.map((item: any) => ({
    tag: item._id,
    count: item.count
  }));
}

export async function fetchDailyStats(filter: Record<string, unknown>, days = 7) {
  const db = await getDb();
  const now = new Date();
  const dailyBuckets: { key: string; label: string }[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const current = new Date(now);
    current.setUTCDate(current.getUTCDate() - index);
    const key = toShanghaiDateKey(current);
    dailyBuckets.push({
      key,
      label: buildShanghaiBucketLabel(key)
    });
  }

  const firstKey = dailyBuckets[0]?.key;
  const pipeline: Record<string, unknown>[] = [];
  appendMatch(
    pipeline,
    filter,
    firstKey
      ? {
          createdAt: {
            $gte: new Date(`${firstKey}T00:00:00+08:00`).toISOString()
          }
        }
      : undefined
  );
  pipeline.push(
    {
      $addFields: {
        shanghaiDay: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: { $toDate: "$createdAt" },
            timezone: "Asia/Shanghai"
          }
        }
      }
    },
    { $group: { _id: "$shanghaiDay", count: { $sum: 1 } } }
  );

  const raw = await db.collection("posts").aggregate(pipeline).toArray();
  const countMap = new Map<string, number>();
  raw.forEach((item: any) => countMap.set(item._id, item.count));

  return dailyBuckets.map((item) => ({
    label: item.label,
    count: countMap.get(item.key) ?? 0
  }));
}

export async function fetchAuthorBreakdown(limit = 100) {
  const db = await getDb();
  const result = await db
    .collection("posts")
    .aggregate([
      {
        $group: {
          _id: {
            ownerId: { $ifNull: ["$ownerId", "legacy"] },
            author: { $ifNull: ["$author", "匿名"] }
          },
          count: { $sum: 1 },
          totalViews: { $sum: { $ifNull: ["$views", 0] } },
          latestCreatedAt: { $max: "$createdAt" }
        }
      },
      { $sort: { count: -1, totalViews: -1, "_id.author": 1 } },
      { $limit: limit }
    ])
    .toArray();

  return result.map((item: any) => ({
    ownerId: item._id.ownerId === "legacy" ? undefined : item._id.ownerId,
    author: item._id.author,
    count: item.count,
    totalViews: item.totalViews,
    avgViews: item.count > 0 ? Math.round(item.totalViews / item.count) : 0,
    latestCreatedAt: item.latestCreatedAt ?? null
  }));
}
