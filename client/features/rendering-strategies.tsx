import { Box, Globe, RefreshCw, Server } from "lucide-react";

const comparisonRows = [
  {
    aspect: "When HTML is generated",
    ssr: "On every request at runtime.",
    csr: "In the browser after JavaScript loads.",
    ssg: "At build time before deployment.",
    isr: "At build time, then regenerated in the background.",
  },
  {
    aspect: "Best for",
    ssr: "Personalized pages, auth dashboards, dynamic SEO pages.",
    csr: "Highly interactive UIs after initial app load.",
    ssg: "Marketing pages, docs, blogs, stable content.",
    isr: "Mostly static pages that still need fresh content over time.",
  },
  {
    aspect: "Tradeoff",
    ssr: "Higher server work and potentially slower TTFB.",
    csr: "Worse SEO and slower first content for many pages.",
    ssg: "Content can become stale until rebuild.",
    isr: "Freshness is not instant and invalidation needs planning.",
  },
  {
    aspect: "Good mental model",
    ssr: "Render now for this specific request.",
    csr: "Ship app shell, then fetch and render on the client.",
    ssg: "Pre-render once and serve fast everywhere.",
    isr: "Pre-render, then refresh cached HTML as needed.",
  },
];

const strategyCards = [
  {
    title: "SSR",
    icon: Server,
    tone: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-emerald-300/30",
    points: [
      "Use when content depends on request-time data like auth, region, or cookies.",
      "Great for dashboards and pages that must stay up to date on every load.",
      "Usually more expensive than static rendering.",
    ],
  },
  {
    title: "CSR",
    icon: Box,
    tone: "from-sky-500/20 via-sky-500/10 to-transparent",
    border: "border-sky-300/30",
    points: [
      "Use when most of the value happens after the app becomes interactive.",
      "Good for internal tools and app-like interfaces.",
      "Often paired with client caching and loading states.",
    ],
  },
  {
    title: "SSG / ISR",
    icon: Globe,
    tone: "from-amber-500/20 via-amber-500/10 to-transparent",
    border: "border-amber-300/30",
    points: [
      "Use SSG when content changes rarely and should be extremely fast.",
      "Use ISR when pages can be mostly static but need periodic freshness.",
      "Excellent for SEO-focused public pages.",
    ],
  },
];

const examples = [
  {
    title: "SSR page",
    icon: Server,
    code: `export default async function Page() {
  const user = await getUser();
  return <Dashboard user={user} />;
}`,
  },
  {
    title: "CSR fetch",
    icon: Box,
    code: `useEffect(() => {
  fetchUsers().then(setUsers);
}, []);`,
  },
  {
    title: "ISR page",
    icon: RefreshCw,
    code: `export const revalidate = 60;`,
  },
];

export function RenderingStrategies() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:max-w-4xl">
        <h2 className="text-center text-3xl font-semibold md:text-left">
          SSR vs CSR vs SSG vs ISR
        </h2>
        <p className="text-center text-sm text-gray-300 md:text-left md:text-base">
          Rendering strategy changes how fast a page loads, how fresh the data is, and how well the
          page works for SEO. In Next.js, choosing the right rendering mode is one of the biggest
          architecture decisions.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-5 border-b border-white/10 bg-white/5 text-sm font-medium text-white">
            <div className="px-4 py-4">Aspect</div>
            <div className="px-4 py-4">SSR</div>
            <div className="px-4 py-4">CSR</div>
            <div className="px-4 py-4">SSG</div>
            <div className="px-4 py-4">ISR</div>
          </div>

          {comparisonRows.map((row) => (
            <div
              key={row.aspect}
              className="grid grid-cols-1 border-b border-white/10 last:border-b-0 md:grid-cols-5"
            >
              <div className="px-4 py-4 text-sm font-semibold text-white/90">{row.aspect}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.ssr}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.csr}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.ssg}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.isr}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),_rgba(15,23,42,0.94)_55%)] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Quick guide</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Default to static when you can, dynamic when you must.
          </h3>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            SSG and ISR are usually great for public content. SSR is better when the response
            depends on the current user or live data. CSR works well for app-heavy interfaces after
            the initial load.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Public pages</p>
              <p className="mt-2 text-sm text-white">SSG or ISR</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                User-specific pages
              </p>
              <p className="mt-2 text-sm text-white">SSR</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Rich interactions</p>
              <p className="mt-2 text-sm text-white">CSR after hydration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {strategyCards.map((card) => {
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

              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-cyan-200">
                <code>{example.code}</code>
              </pre>
            </div>
          );
        })}
      </div>
    </section>
  );
}
