import { Boxes, Cloud, Layers, PanelTop, Workflow } from "lucide-react";

const comparisonRows = [
  {
    aspect: "Local state",
    description: "UI state for one component or a small subtree.",
    examples: "modal open, input value, selected tab",
  },
  {
    aspect: "Server state",
    description: "Data owned by the backend and fetched asynchronously.",
    examples: "users list, messages, orders, analytics",
  },
  {
    aspect: "Global client state",
    description: "Shared client-side state needed across distant parts of the app.",
    examples: "theme, sidebar state, wizard progress, draft filters",
  },
];

const cards = [
  {
    title: "Local state",
    icon: PanelTop,
    tone: "from-sky-500/20 via-sky-500/10 to-transparent",
    border: "border-sky-300/30",
    points: [
      "Use React state when the data only matters to one screen or component tree.",
      "This is the simplest and usually the best default.",
      "Do not lift it globally unless multiple distant areas truly need it.",
    ],
  },
  {
    title: "Server state",
    icon: Cloud,
    tone: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-emerald-300/30",
    points: [
      "Use TanStack Query for fetching, caching, invalidation, and background refetching.",
      "Server state is not the same as local UI state.",
      "Treat fetched backend data as remote and synchronized, not hand-managed everywhere.",
    ],
  },
  {
    title: "Global state",
    icon: Boxes,
    tone: "from-violet-500/20 via-violet-500/10 to-transparent",
    border: "border-violet-300/30",
    points: [
      "Use Zustand or context when multiple unrelated parts of the app need the same client value.",
      "Good for app-wide preferences and cross-page UI state.",
      "Avoid putting all fetched API data into a global store by default.",
    ],
  },
];

const examples = [
  {
    title: "Local UI state",
    icon: Layers,
    code: `const [open, setOpen] = useState(false);`,
  },
  {
    title: "Server state",
    icon: Workflow,
    code: `const { data } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});`,
  },
  {
    title: "Global store",
    icon: Boxes,
    code: `const useAppStore = create(() => ({
  sidebarOpen: false,
}));`,
  },
];

export function StateManagement() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:max-w-4xl">
        <h2 className="text-center text-3xl font-semibold md:text-left">State Management</h2>
        <p className="text-center text-sm text-gray-300 md:text-left md:text-base">
          Not all state should be managed the same way. The most useful split in modern React apps
          is local state, server state, and global client state. Each one has a different source of
          truth and different tools.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-3 border-b border-white/10 bg-white/5 text-sm font-medium text-white">
            <div className="px-4 py-4">Type</div>
            <div className="px-4 py-4">What it means</div>
            <div className="px-4 py-4">Examples</div>
          </div>

          {comparisonRows.map((row) => (
            <div
              key={row.aspect}
              className="grid grid-cols-1 border-b border-white/10 last:border-b-0 md:grid-cols-3"
            >
              <div className="px-4 py-4 text-sm font-semibold text-white/90">{row.aspect}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.description}</div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">{row.examples}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_rgba(15,23,42,0.94)_55%)] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/80">Quick guide</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Keep state as close as possible to where it is used.
          </h3>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            Use local state first. Use TanStack Query for backend data. Reach for a global store
            only when multiple distant parts of the app truly need shared client-side state.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">UI interactions</p>
              <p className="mt-2 text-sm text-white">Local state</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">API data</p>
              <p className="mt-2 text-sm text-white">Server state tools</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Cross-app shared state
              </p>
              <p className="mt-2 text-sm text-white">Global store</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
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

              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-emerald-200">
                <code>{example.code}</code>
              </pre>
            </div>
          );
        })}
      </div>
    </section>
  );
}
