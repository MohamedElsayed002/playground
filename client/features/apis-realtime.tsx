import Link from "next/link";
import {
  ArrowUpRight,
  Cable,
  GitPullRequestArrow,
  Radio,
  Waves,
} from "lucide-react";

const comparisonRows = [
  {
    aspect: "Communication style",
    rest: "Multiple endpoints, each one represents a resource.",
    graphql: "Single endpoint where the client asks for exactly the fields it needs.",
    socketio: "Persistent two-way connection for live events.",
  },
  {
    aspect: "Best request pattern",
    rest: "Request/response over HTTP with clear routes and verbs.",
    graphql: "Query, mutation, and subscription style data access.",
    socketio: "Event-driven messaging between client and server.",
  },
  {
    aspect: "Great for",
    rest: "CRUD APIs, public APIs, service-to-service communication.",
    graphql: "Complex frontends, dashboards, mobile apps with varied data needs.",
    socketio: "Chat, presence, notifications, live collaboration, streaming state.",
  },
  {
    aspect: "Main tradeoff",
    rest: "Can overfetch or underfetch when screens need mixed resources.",
    graphql: "More setup, schema design, and resolver complexity.",
    socketio: "Connection state, scaling, and delivery rules need extra care.",
  },
];

const recommendationCards = [
  {
    title: "Choose REST API",
    icon: Cable,
    tone: "from-orange-500/20 via-orange-500/10 to-transparent",
    border: "border-orange-300/30",
    points: [
      "You want predictable endpoints like /users, /orders, and /products.",
      "Caching, HTTP status codes, and simple backend contracts matter.",
      "Your app is mostly request/response and does not need real-time sync.",
    ],
  },
  {
    title: "Choose GraphQL",
    icon: GitPullRequestArrow,
    tone: "from-pink-500/20 via-pink-500/10 to-transparent",
    border: "border-pink-300/30",
    points: [
      "One screen needs data from many related resources in one request.",
      "Frontend teams need flexibility without adding many new endpoints.",
      "You want a strongly typed schema shared across clients.",
    ],
  },
  {
    title: "Choose Socket.IO",
    icon: Radio,
    tone: "from-cyan-500/20 via-cyan-500/10 to-transparent",
    border: "border-cyan-300/30",
    points: [
      "Users should see updates instantly without refreshing or polling.",
      "Presence, typing indicators, room events, or live dashboards matter.",
      "The server needs to push events to clients in real time.",
    ],
  },
];

const examples = [
  {
    title: "REST endpoint",
    icon: Cable,
    code: `GET /api/users/42

{
  "id": 42,
  "name": "Mohamed"
}`,
  },
  {
    title: "GraphQL query",
    icon: GitPullRequestArrow,
    code: `query {
  user(id: 42) {
    name
    posts {
      title
    }
  }
}`,
  },
  {
    title: "Socket.IO event",
    icon: Waves,
    code: `socket.emit("message:send", {
  roomId: "general",
  text: "hello"
});`,
  },
];

export function APIsAndRealtime() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:max-w-4xl">
        <h2 className="text-center text-3xl font-semibold md:text-left">
          REST API vs GraphQL vs Socket.IO
        </h2>
        <p className="text-center text-sm text-gray-300 md:text-left md:text-base">
          These tools solve different communication problems. REST is great for
          standard HTTP APIs, GraphQL is strong when clients need flexible data
          fetching, and Socket.IO is built for real-time event updates.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-4 border-b border-white/10 bg-white/5 text-sm font-medium text-white">
            <div className="px-4 py-4">Aspect</div>
            <div className="px-4 py-4">REST</div>
            <div className="px-4 py-4">GraphQL</div>
            <div className="px-4 py-4">Socket.IO</div>
          </div>

          {comparisonRows.map((row) => (
            <div
              key={row.aspect}
              className="grid grid-cols-1 border-b border-white/10 last:border-b-0 md:grid-cols-4"
            >
              <div className="px-4 py-4 text-sm font-semibold text-white/90">
                {row.aspect}
              </div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">
                {row.rest}
              </div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">
                {row.graphql}
              </div>
              <div className="px-4 py-4 text-sm leading-6 text-gray-300">
                {row.socketio}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-violet-300/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_rgba(15,23,42,0.94)_55%)] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">
            Quick guide
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Use the transport that matches the user experience.
          </h3>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            If the user asks for data, REST is usually the simplest choice. If
            the screen needs many shapes of related data, GraphQL can reduce
            round trips. If the server must push updates instantly, use
            Socket.IO.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Simple default
              </p>
              <p className="mt-2 text-sm text-white">REST for CRUD apps</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Flexible reads
              </p>
              <p className="mt-2 text-sm text-white">
                GraphQL for complex frontend data needs
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Live updates
              </p>
              <p className="mt-2 text-sm text-white">
                Socket.IO for chat, rooms, and presence
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {recommendationCards.map((card) => {
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
                <h3 className="text-lg font-semibold text-white">
                  {example.title}
                </h3>
              </div>

              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-cyan-200">
                <code>{example.code}</code>
              </pre>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Reference idea</p>
          <p className="text-sm text-gray-300">
            REST handles standard APIs, GraphQL handles flexible queries, and
            Socket.IO handles real-time events.
          </p>
        </div>

        <Link
          href="/rooms"
          className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
        >
          See your Socket.IO example
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
