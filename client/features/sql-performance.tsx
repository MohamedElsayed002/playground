import { FileSearch2, Gauge, SearchCheck, TableProperties, Zap } from "lucide-react";

const comparisonRows = [
  {
    aspect: "Main goal",
    indexing: "Help the database find rows faster.",
    optimization: "Improve the full query plan, joins, filters, and returned data.",
  },
  {
    aspect: "Typical action",
    indexing: "Add indexes to frequently filtered, joined, or sorted columns.",
    optimization: "Rewrite queries, avoid SELECT *, reduce scans, and fix joins.",
  },
  {
    aspect: "Best for",
    indexing: "Slow lookups on columns like email, user_id, created_at.",
    optimization: "Heavy reports, large joins, poor pagination, expensive aggregations.",
  },
  {
    aspect: "Tradeoff",
    indexing: "Faster reads but slower writes and more storage usage.",
    optimization: "Requires understanding execution plans and data access patterns.",
  },
];

const cards = [
  {
    title: "Indexing",
    icon: SearchCheck,
    tone: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-emerald-300/30",
    points: [
      "Add indexes to columns used in WHERE, JOIN, ORDER BY, and UNIQUE checks.",
      "Very helpful for user lookups, foreign keys, and sorted feeds.",
      "Too many indexes slow inserts and updates.",
    ],
  },
  {
    title: "Query optimization",
    icon: Gauge,
    tone: "from-orange-500/20 via-orange-500/10 to-transparent",
    border: "border-orange-300/30",
    points: [
      "Select only needed columns instead of using SELECT *.",
      "Check join patterns, pagination strategy, and filter order.",
      "Use EXPLAIN ANALYZE to see what the database is actually doing.",
    ],
  },
];

const examples = [
  {
    title: "Add an index",
    icon: TableProperties,
    code: `CREATE INDEX idx_users_email
ON users(email);`,
  },
  {
    title: "Better pagination",
    icon: Zap,
    code: `SELECT id, name
FROM users
WHERE id > 1000
ORDER BY id
LIMIT 20;`,
  },
  {
    title: "Inspect a query",
    icon: FileSearch2,
    code: `EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = 42;`,
  },
];

export function SQLPerformance() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:max-w-4xl">
        <h2 className="text-center text-3xl font-semibold md:text-left">
          SQL Indexing vs Query Optimization
        </h2>
        <p className="text-center text-sm text-gray-300 md:text-left md:text-base">
          Slow SQL is not always fixed by adding an index. Sometimes the real problem is the query
          shape, the join strategy, or the amount of data being scanned and returned.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-3 border-b border-white/10 bg-white/5 text-sm font-medium text-white">
            <div className="px-4 py-4">Aspect</div>
            <div className="px-4 py-4">Indexing</div>
            <div className="px-4 py-4">Optimization</div>
          </div>

          {comparisonRows.map((row) => (
            <div
              key={row.aspect}
              className="grid grid-cols-1 border-b border-white/10 last:border-b-0 md:grid-cols-3"
            >
              <div className="px-4 py-4 text-sm font-semibold text-white/90">{row.aspect}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.indexing}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.optimization}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-orange-300/20 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_rgba(15,23,42,0.94)_55%)] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-orange-200/80">Quick guide</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Indexes help access. Optimization helps everything else.
          </h3>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            If a query filters on the same columns often, indexing may help a lot. But if the query
            returns too much data or joins badly, you also need to optimize the query itself.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Index first for</p>
              <p className="mt-2 text-sm text-white">repeated lookups and joins</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Optimize query for</p>
              <p className="mt-2 text-sm text-white">
                large scans, bad pagination, and heavy reports
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`rounded-[2rem] border bg-gradient-to-br ${card.tone} ${card.border} p-6`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <Icon className="size-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              </div>

              <div className="mt-5 space-y-3">
                {card.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-gray-200"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {examples.map((example) => {
          const Icon = example.icon;

          return (
            <div
              key={example.title}
              className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <Icon className="size-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{example.title}</h3>
              </div>

              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-orange-200">
                <code>{example.code}</code>
              </pre>
            </div>
          );
        })}
      </div>
    </section>
  );
}
