import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { analyticsDay } from "@/lib/analytics/record";
import { VITAL_LABELS, formatVital } from "@/lib/analytics/vitals";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [7, 30, 90] as const;
const DEFAULT_RANGE = 30;

/**
 * Traffic report, built entirely from our own aggregate tables.
 *
 * What it deliberately cannot show: an individual visitor, a session path, or
 * anything about signed-in navigation. Those aren't collected (see
 * src/lib/analytics/record.ts), so no view here could reconstruct them.
 */
export default async function AdminAnalyticsPage(
  props: PageProps<"/admin/analytics">,
) {
  const params = await props.searchParams;
  const requested = Number(Array.isArray(params.days) ? params.days[0] : params.days);
  const days = RANGES.includes(requested as (typeof RANGES)[number])
    ? requested
    : DEFAULT_RANGE;

  const today = analyticsDay();
  const since = new Date(today.getTime() - (days - 1) * 86_400_000);

  const [views, visitors, referrers, vitals] = await Promise.all([
    db.pageViewDaily.findMany({
      where: { day: { gte: since } },
      select: { day: true, path: true, views: true },
    }),
    db.visitorDaily.groupBy({
      by: ["day"],
      where: { day: { gte: since } },
      _count: { visitorHash: true },
    }),
    db.referrerDaily.groupBy({
      by: ["host"],
      where: { day: { gte: since } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 10,
    }),
    db.webVitalDaily.groupBy({
      by: ["metric"],
      where: { day: { gte: since } },
      _sum: { count: true, total: true, good: true, fair: true, poor: true },
    }),
  ]);

  const totalViews = views.reduce((sum, row) => sum + row.views, 0);
  const totalVisitors = visitors.reduce((sum, row) => sum + row._count.visitorHash, 0);

  // Roll the per-(day, path) rows up two ways: by day for the chart, by path for
  // the table. One query, two shapes — cheaper than asking Postgres twice.
  const viewsByDay = new Map<string, number>();
  const viewsByPath = new Map<string, number>();
  for (const row of views) {
    const key = row.day.toISOString().slice(0, 10);
    viewsByDay.set(key, (viewsByDay.get(key) ?? 0) + row.views);
    viewsByPath.set(row.path, (viewsByPath.get(row.path) ?? 0) + row.views);
  }
  const visitorsByDay = new Map(
    visitors.map((row) => [row.day.toISOString().slice(0, 10), row._count.visitorHash]),
  );

  // Every day in the range, so a gap reads as zero traffic rather than vanishing.
  const timeline = Array.from({ length: days }, (_, i) => {
    const date = new Date(since.getTime() + i * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      views: viewsByDay.get(key) ?? 0,
      visitors: visitorsByDay.get(key) ?? 0,
    };
  });
  const peak = Math.max(1, ...timeline.map((d) => d.views));

  const topPages = [...viewsByPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const stats = [
    { label: "Page views", value: totalViews.toLocaleString("en-GB") },
    { label: "Unique visitors", value: totalVisitors.toLocaleString("en-GB") },
    {
      label: "Views per day",
      // One decimal below ten, or a quiet period reads as a flat "0".
      value:
        totalViews / days < 10
          ? (totalViews / days).toFixed(1)
          : Math.round(totalViews / days).toLocaleString("en-GB"),
    },
    { label: "Pages seen", value: viewsByPath.size.toLocaleString("en-GB") },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-1 text-sm text-slate-600">
            Public-page traffic, measured on our own server. No cookies, no third
            party, and signed-in pages are never counted.
          </p>
        </div>
        <nav className="flex gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
          {RANGES.map((range) => (
            <Link
              key={range}
              href={`/admin/analytics?days=${range}`}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === days
                  ? "bg-bdaio-blue text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {range} days
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Daily traffic</h2>
        {totalViews === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nothing recorded in this range yet. Views appear once visitors load a
            public page with JavaScript enabled.
          </p>
        ) : (
          <div className="mt-4 flex h-40 items-end gap-1 overflow-x-auto">
            {timeline.map((day) => (
              // h-full is load-bearing: the bars are sized in percentages, and
              // without it this column is content-height (zero) and they vanish.
              // The two bars sit side by side rather than stacked — stacking them
              // would add up to more than the peak and read as one huge bar.
              <div
                key={day.key}
                className="flex h-full min-w-[8px] flex-1 items-end gap-px"
                title={`${day.label}: ${day.views} views · ${day.visitors} visitors`}
              >
                <div
                  className="w-1/2 rounded-t bg-bdaio-blue/80"
                  style={{ height: `${(day.views / peak) * 100}%` }}
                />
                <div
                  className="w-1/2 rounded-t bg-bdaio-blue-light"
                  style={{ height: `${(day.visitors / peak) * 100}%` }}
                />
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-bdaio-blue/80" /> Page views
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-bdaio-blue-light" /> Unique
            visitors
          </span>
          <span>{timeline[0]?.label} → {timeline[timeline.length - 1]?.label}</span>
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Top pages</h2>
          {topPages.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No pages recorded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {topPages.map(([path, count]) => (
                <li
                  key={path}
                  className="flex items-baseline justify-between gap-3 py-2"
                >
                  <Link
                    href={path}
                    className="truncate font-mono text-xs text-bdaio-blue hover:underline"
                  >
                    {path}
                  </Link>
                  <span className="shrink-0 text-xs font-semibold text-slate-700">
                    {count.toLocaleString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Referrers</h2>
          <p className="mt-1 text-xs text-slate-500">
            Host only — the full referring URL is never stored.
          </p>
          {referrers.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No external referrers yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {referrers.map((row) => (
                <li
                  key={row.host}
                  className="flex items-baseline justify-between gap-3 py-2"
                >
                  <span className="truncate font-mono text-xs text-slate-700">
                    {row.host}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-slate-700">
                    {(row._sum.count ?? 0).toLocaleString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">
          Core Web Vitals
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Measured in real visitors&apos; browsers. The mean is shown rather than
          the 75th percentile — keeping a true p75 would mean storing every
          sample.
        </p>
        {vitals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No samples yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {vitals.map((row) => {
              const count = row._sum.count ?? 0;
              const good = row._sum.good ?? 0;
              const fair = row._sum.fair ?? 0;
              const poor = row._sum.poor ?? 0;
              const mean = count > 0 ? (row._sum.total ?? 0) / count : 0;
              const pct = (n: number) => (count > 0 ? (n / count) * 100 : 0);

              return (
                <div key={row.metric}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">
                      {row.metric}
                      <span className="ml-2 font-normal text-slate-500">
                        {VITAL_LABELS[row.metric] ?? ""}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600">
                      mean {formatVital(row.metric, mean)} ·{" "}
                      {count.toLocaleString("en-GB")}{" "}
                      {count === 1 ? "sample" : "samples"}
                    </p>
                  </div>
                  <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${pct(good)}%` }}
                      title={`${good} good`}
                    />
                    <div
                      className="bg-amber-400"
                      style={{ width: `${pct(fair)}%` }}
                      title={`${fair} needs improvement`}
                    />
                    <div
                      className="bg-rose-500"
                      style={{ width: `${pct(poor)}%` }}
                      title={`${poor} poor`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {Math.round(pct(good))}% good · {Math.round(pct(fair))}% needs
                    improvement · {Math.round(pct(poor))}% poor
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
