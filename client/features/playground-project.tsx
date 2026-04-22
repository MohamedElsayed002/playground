"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PlaygroundProject() {
  const router = useRouter();

  useHotkey("Control+Space", () => {
    router.push("/");
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <span
        onClick={() => router.push("/")}
        className="my-5 flex cursor-pointer gap-4"
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") router.push("/");
        }}
      >
        <ArrowLeft size={20} />
        Back / Ctrl+Space
      </span>

      {/* Hero */}
      <section className="rounded-2xl border bg-linear-to-b from-zinc-50 to-white p-8 shadow-sm dark:from-zinc-950 dark:to-zinc-950/60">
        <p className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur dark:bg-zinc-950/60 dark:text-zinc-300">
          NestJS • Next.js • Prisma • GraphQL • LangGraph • TanStack
        </p>

        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
          Playground
        </h1>
        <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          A personal{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            full-stack and AI lab
          </span>{" "}
          in one monorepo: a production-shaped NestJS API, a Next.js client focused on performance
          and real integrations, and a separate Python space for LangGraph agents, tools, and
          notebooks. The point is not to ship a clone of a tutorial—it&apos;s to connect ideas
          end-to-end and keep a paper trail of decisions.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          I document what I build in <span className="font-medium">Notion</span> and{" "}
          <span className="font-medium">Markdown</span> (including notes under{" "}
          <span className="font-medium">client/docs</span>
          ). I lean on official docs and release notes—there is no magic, only reading carefully and
          iterating.
        </p>
      </section>

      {/* Three pillars */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          What lives in the repo
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Same mental model as shipping a small product: backend contracts, a client that consumes
          them, and experiments that don&apos;t belong in production—but still follow clear
          structure.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Backend (NestJS)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              GraphQL, REST, Socket.IO, Prisma/PostgreSQL, JWT and OAuth flows, Swagger, and AI
              modules (Vercel AI SDK, Gemini, code execution, file analysis). Observability hooks
              like Sentry sit where a real API would.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Client (Next.js)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              App Router, TanStack Query/Table/Virtual/Form, GraphQL + WebSocket clients, chat and
              realtime demos, auth UX, and performance routes (virtualized lists, bundle-aware
              patterns). The UI is a place to stress-test ideas, not only paint screens.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              LangGraph (Python)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Notebooks for graphs, state, and routing; scripts for ReAct-style agents, memory,
              tools, and RAG. Isolated from the TypeScript apps so I can learn graph-based LLM
              workflows without mixing runtimes.
            </p>
          </div>
        </div>
      </section>

      {/* Performance section */}
      <section className="mt-12">
        <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            10k users performance: the difference between the 3 approaches
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            The section in <span className="font-medium">client/features/performance.tsx</span> compares
            the same data volume with three rendering strategies so the impact is easy to see in
            practice.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Bad performance</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Fetches and renders all 10k users immediately. This increases initial render time,
                mounts too many DOM nodes, and hurts responsiveness.
              </p>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">react-window</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Virtualizes rows so only visible items are mounted. It reduces work and memory usage,
                improving scroll and interaction.
              </p>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                TanStack Virtualized
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Also virtualized, with strong control and composability. It keeps large lists smooth
                while integrating well with richer UI patterns.
              </p>
            </div>
          </div>

          <p className="mt-4 rounded-xl border bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Result:</span> both
            virtualized versions perform much better than the non-virtualized 10k baseline.
          </p>
        </div>
      </section>

      {/* Evidence */}
      <section className="mt-12">
        <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Proof: bundle analysis, Web Vitals, and Lighthouse
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            These screenshots document the optimization impact and overall quality status across the
            app.
          </p>

          <h3 className="mt-6 text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Client bundle analyzer (before vs after)
          </h3>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <figure className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900">
              <Image
                src="/client-bundler-before.png"
                alt="Client bundle treemap before optimization"
                width={1600}
                height={900}
                className="h-auto w-full rounded-md"
              />
              <figcaption className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Before optimization.
              </figcaption>
            </figure>
            <figure className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900">
              <Image
                src="/client-bundler-after.png"
                alt="Client bundle treemap after optimization"
                width={1600}
                height={900}
                className="h-auto w-full rounded-md"
              />
              <figcaption className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                After optimization.
              </figcaption>
            </figure>
          </div>

          <h3 className="mt-6 text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Node.js bundle analyzer (before vs after)
          </h3>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <figure className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900">
              <Image
                src="/nodejs-bundler-before.png"
                alt="Node.js bundle treemap before optimization"
                width={1600}
                height={900}
                className="h-auto w-full rounded-md"
              />
              <figcaption className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Before optimization.
              </figcaption>
            </figure>
            <figure className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900">
              <Image
                src="/nodejs-bundler-after.png"
                alt="Node.js bundle treemap after optimization"
                width={1600}
                height={900}
                className="h-auto w-full rounded-md"
              />
              <figcaption className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                After optimization.
              </figcaption>
            </figure>
          </div>

          <h3 className="mt-6 text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Overall page health
          </h3>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <figure className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900">
              <Image
                src="/webvitals.png"
                alt="Web Vitals output with good FCP, TTFB, LCP, and CLS values"
                width={1600}
                height={900}
                className="h-auto w-full rounded-md"
              />
              <figcaption className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Web Vitals across pages are in the good range.
              </figcaption>
            </figure>
            <figure className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-900">
              <Image
                src="/lighthouse.png"
                alt="Lighthouse results all green for performance, accessibility, best practices, and SEO"
                width={1600}
                height={900}
                className="h-auto w-full rounded-md"
              />
              <figcaption className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Lighthouse is green across all categories.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Layout + docs */}
      <section className="mt-12">
        <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Repository layout
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            The monorepo is intentionally split so each runtime stays focused. The root{" "}
            <span className="font-medium">README</span> is the source of truth for folders and
            capabilities.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border bg-zinc-50 p-4 text-left text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {`backend/     → NestJS API (REST, GraphQL, WebSockets, Prisma, AI modules)
client/      → Next.js App Router, TanStack, chat, demos, docs
LangGraph/   → Python notebooks + agents (graphs, tools, RAG)`}
          </pre>
        </div>
      </section>

      {/* AI routes + approach */}
      <section className="mt-12">
        <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            AI section approach
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            The AI card in <span className="font-medium">client/features/live-stream.tsx</span> links to
            three focused routes so each capability can be tested independently.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Admin</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Database-focused tools to fetch, search, update, and delete users from the app with
                controlled server-side actions.
              </p>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Realtime Voice Chat
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Realtime conversation flow for general chat, focused on streaming UX and live
                interactions.
              </p>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ChatEGY</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Tool-driven assistant workflows: deep search, code execution, and file analysis (for
                images and PDF inputs).
              </p>
            </div>
          </div>

          <h3 className="mt-6 text-base font-semibold text-zinc-950 dark:text-zinc-50">
            API route design (`/api/chat`)
          </h3>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            In <span className="font-medium">client/app/api/chat/route.ts</span>, I use{" "}
            <span className="font-medium">@tanstack/ai</span> with an OpenAI adapter and stream the
            response as Server-Sent Events. The route is force-dynamic, validates environment
            configuration early, and exposes explicit tools (get user data, update, delete, search,
            totals) so model output can trigger concrete server actions safely.
          </p>
        </div>
      </section>

      {/* Links + stack */}
      <section className="mt-12">
        <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Source and app
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            Explore the code or jump back into the running client.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              href="https://github.com/MohamedElsayed002/playground"
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border bg-zinc-50 p-4 transition hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-900/70"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Code source (GitHub)
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Repository: playground
              </p>
              <p className="mt-3 text-xs font-medium text-zinc-900 underline underline-offset-4 group-hover:opacity-80 dark:text-zinc-100">
                Open repository →
              </p>
            </a>

            <Link
              href="/"
              className="group rounded-xl border bg-zinc-50 p-4 transition hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-900/70"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Live app</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Return to the main Next.js client
              </p>
              <p className="mt-3 text-xs font-medium text-zinc-900 underline underline-offset-4 group-hover:opacity-80 dark:text-zinc-100">
                Open home →
              </p>
            </Link>
          </div>

          <h3 className="mt-8 text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Tools and libraries (high level)
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "TypeScript",
              "NestJS",
              "Next.js",
              "React",
              "Prisma",
              "PostgreSQL",
              "GraphQL",
              "Apollo",
              "Socket.IO",
              "TanStack Query",
              "TanStack Table",
              "TanStack Virtual",
              "Zod",
              "Zustand",
              "Vercel AI SDK",
              "LangGraph",
              "LangChain",
              "Sentry",
              "Tailwind CSS",
              "Docker",
              "Python",
              "FastAPI"
            ].map((tool) => (
              <span
                key={tool}
                className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300"
              >
                {tool}
              </span>
            ))}
          </div>

          <div className="mt-8 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Deployment and containerization
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              The project is containerized with Docker, and images are published to Docker Hub.
            </p>
            <a
              href="https://hub.docker.com/repositories/mosayed2002"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 hover:opacity-80 dark:text-zinc-100"
            >
              Docker Hub: mosayed2002
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
