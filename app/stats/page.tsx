import { cookies } from "next/headers";
import { cookieName, isAdminSession, verifySession } from "@/lib/auth";
import { buildOwnedPostFilter } from "@/lib/posts";
import { fetchAuthorBreakdown, fetchDailyStats, fetchStatsSummary, fetchTagStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

const cardClass = "rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100";

function formatTime(input?: string | null) {
  if (!input) {
    return "暂无数据";
  }

  return new Date(input).toLocaleString("zh-CN", {
    hour12: false,
    timeZone: "Asia/Shanghai"
  });
}

function MetricCard({
  label,
  value
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className={cardClass}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ProgressList({
  items,
  emptyText,
  colorClass,
  valueLabel
}: {
  items: Array<{ label: string; count: number }>;
  emptyText: string;
  colorClass: string;
  valueLabel?: (count: number) => string;
}) {
  const maxValue = Math.max(...items.map((item) => item.count), 1);

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{item.label}</span>
            <span>{valueLabel ? valueLabel(item.count) : item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${colorClass}`}
              style={{ width: `${(item.count / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopPosts({
  title,
  items,
  latestText
}: {
  title: string;
  items: Array<{ title: string; slug: string; views: number }>;
  latestText: string;
}) {
  return (
    <div className={cardClass}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">暂无内容。</p>
        ) : (
          items.map((item) => (
            <div key={item.slug} className="flex items-center justify-between gap-3 text-sm">
              <a href={`/p/${item.slug}`} className="truncate text-slate-800 hover:text-brand-600">
                {item.title}
              </a>
              <span className="shrink-0 text-slate-500">{item.views} 次浏览</span>
            </div>
          ))
        )}
      </div>
      <p className="mt-4 text-xs text-slate-500">{latestText}</p>
    </div>
  );
}

export default async function StatsPage() {
  const token = cookies().get(cookieName)?.value;
  const session = await verifySession(token);
  const personalFilter = buildOwnedPostFilter(session);
  const adminView = isAdminSession(session);

  const [mySummary, overallSummary, myTags, myDaily, authorBreakdown] = await Promise.all([
    fetchStatsSummary(personalFilter),
    fetchStatsSummary({}),
    fetchTagStats(personalFilter, 8),
    fetchDailyStats(personalFilter, 7),
    adminView ? fetchAuthorBreakdown() : Promise.resolve([])
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">统计中心</h1>
            <p className="mt-2 text-sm text-slate-500">
              登录用户可以查看自己的发布统计和全站汇总，管理员还可以查看所有用户的统计结果。
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
          >
            返回后台
          </a>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">我的统计</h2>
          <span className="text-sm text-slate-500">{session?.name || "未知用户"}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="我的发布数" value={mySummary.total} />
          <MetricCard label="我的总浏览" value={mySummary.totalViews} />
          <MetricCard label="篇均浏览" value={mySummary.avgViews} />
          <MetricCard label="我的标签数" value={mySummary.tagCount} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TopPosts
            title="热门内容"
            items={mySummary.top}
            latestText={
              mySummary.latest
                ? `最近发布：${mySummary.latest.title} · ${formatTime(mySummary.latest.createdAt)}`
                : "最近发布：暂无数据"
            }
          />

          <div className={cardClass}>
            <h3 className="text-base font-semibold text-slate-900">常用标签</h3>
            <div className="mt-3">
              <ProgressList
                items={myTags.map((item) => ({ label: `#${item.tag}`, count: item.count }))}
                emptyText="暂无标签统计。"
                colorClass="bg-brand-500/80"
              />
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="text-base font-semibold text-slate-900">最近 7 天</h3>
          <div className="mt-3">
            <ProgressList
              items={myDaily.map((item) => ({ label: item.label, count: item.count }))}
              emptyText="最近 7 天暂无发布记录。"
              colorClass="bg-emerald-500/80"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">全站统计</h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="总发布数" value={overallSummary.total} />
          <MetricCard label="总浏览数" value={overallSummary.totalViews} />
          <MetricCard label="篇均浏览" value={overallSummary.avgViews} />
          <MetricCard label="标签总数" value={overallSummary.tagCount} />
          <MetricCard label="作者数" value={overallSummary.authorCount} />
        </div>

        <TopPosts
          title="全站热门内容"
          items={overallSummary.top}
          latestText={
            overallSummary.latest
              ? `最近发布：${overallSummary.latest.title} · ${formatTime(overallSummary.latest.createdAt)}`
              : "最近发布：暂无数据"
          }
        />
      </section>

      {adminView ? (
        <section className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">全用户统计</h2>
              <p className="mt-1 text-sm text-slate-500">管理员可以在这里查看每个用户的发布量和浏览汇总。</p>
            </div>
          </div>

          {authorBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">暂无用户统计数据。</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pb-3 pr-4 font-medium">用户</th>
                    <th className="pb-3 pr-4 font-medium">发布数</th>
                    <th className="pb-3 pr-4 font-medium">浏览数</th>
                    <th className="pb-3 pr-4 font-medium">篇均浏览</th>
                    <th className="pb-3 font-medium">最近发布时间</th>
                  </tr>
                </thead>
                <tbody>
                  {authorBreakdown.map((item) => (
                    <tr key={`${item.ownerId || "legacy"}-${item.author}`} className="border-b border-slate-50">
                      <td className="py-3 pr-4 text-slate-800">{item.author}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.count}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.totalViews}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.avgViews}</td>
                      <td className="py-3 text-slate-600">{formatTime(item.latestCreatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
