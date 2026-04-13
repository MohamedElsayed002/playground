import Link from "next/link";
import { ArrowUpRight, Braces, Database, GitBranchPlus, ShieldCheck } from "lucide-react";

const comparisonRows = [
  {
    aspect: "Structure",
    sql: "Tables with rows, columns, and explicit relationships.",
    nosql: "Documents, key-value pairs, graphs, or wide-column records.",
  },
  {
    aspect: "Schema",
    sql: "Strict and predefined, which keeps data predictable.",
    nosql: "Flexible and easier to evolve while requirements are changing.",
  },
  {
    aspect: "Scaling",
    sql: "Usually scales vertically by upgrading a single server.",
    nosql: "Usually scales horizontally by spreading load across nodes.",
  },
  {
    aspect: "Consistency",
    sql: "Strong transactional guarantees with ACID-friendly workflows.",
    nosql: "Can trade strict consistency for availability and scale.",
  },
];

const decisionCards = [
  {
    title: "Choose PostgreSQL / SQL",
    icon: ShieldCheck,
    tone: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-emerald-400/30",
    points: [
      "Payments, orders, and inventory rely on reliable transactions.",
      "Your app depends on joins, foreign keys, and structured reporting.",
      "Large teams need schema enforcement to reduce bad writes.",
    ],
  },
  {
    title: "Choose MongoDB / NoSQL",
    icon: GitBranchPlus,
    tone: "from-sky-500/20 via-sky-500/10 to-transparent",
    border: "border-sky-400/30",
    points: [
      "Data shapes change often and you want faster iteration.",
      "You store JSON-like content, feeds, logs, or nested objects.",
      "You need to scale reads and writes across distributed systems.",
    ],
  },
];

const codeExamples = [
  {
    title: "SQL: normalized data + JOIN",
    icon: Database,
    code: `SELECT posts.title, users.name
FROM posts
JOIN users ON users.id = posts.user_id;`,
  },
  {
    title: "NoSQL: nested document",
    icon: Braces,
    code: `{
  "name": "Mohamed",
  "posts": [
    { "title": "Post 1" },
    { "title": "Post 2" }
  ]
}`,
  },
];

export function NoSQLVSSQL() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:max-w-3xl">
        <h2 className="text-center text-3xl font-semibold md:text-left">NoSQL vs SQL</h2>
        <p className="text-center text-sm text-gray-300 md:text-left md:text-base">
          A quick comparison between document databases like MongoDB and relational databases like
          PostgreSQL, focused on schema design, scaling, consistency, and real-world use cases.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-3 border-b border-white/10 bg-white/5 text-sm font-medium text-white">
            <div className="px-4 py-4">Aspect</div>
            <div className="px-4 py-4">SQL</div>
            <div className="px-4 py-4">NoSQL</div>
          </div>

          {comparisonRows.map((row) => (
            <div
              key={row.aspect}
              className="grid grid-cols-1 border-b border-white/10 last:border-b-0 md:grid-cols-3"
            >
              <div className="px-4 py-4 text-sm font-semibold text-white/90">{row.aspect}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.sql}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.nosql}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_rgba(15,23,42,0.92)_55%)] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-200/80">Rule of thumb</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Model the data first, then pick the database.
          </h3>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            SQL is usually the safer default when relationships and transactions matter. NoSQL
            shines when the shape of the data changes often or the system needs document-style
            flexibility at scale.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Best for SQL</p>
              <p className="mt-2 text-sm text-white">Banking, ERP, orders</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Best for NoSQL</p>
              <p className="mt-2 text-sm text-white">Feeds, CMS, logs, chat</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Tradeoff</p>
              <p className="mt-2 text-sm text-white">Flexibility vs stronger constraints</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {decisionCards.map((card) => {
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

      <div className="grid gap-4 lg:grid-cols-2">
        {codeExamples.map((example) => {
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

              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-emerald-200">
                <code>{example.code}</code>
              </pre>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Reference</p>
          <p className="text-sm text-gray-300">
            MongoDB guide comparing SQL and NoSQL database models.
          </p>
        </div>

        <Link
          href="https://www.mongodb.com/resources/basics/databases/nosql-explained/nosql-vs-sql"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition hover:text-sky-200"
        >
          Open resource
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
