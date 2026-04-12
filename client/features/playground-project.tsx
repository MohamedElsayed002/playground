"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { ArrowLeft } from "lucide-react";
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

      {/* Story + goals */}
      {/* <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            What I optimize for
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            <li className="flex gap-3">
              <span className="mt-1 inline-block size-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              <span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Clarity over novelty</span>: small
                features wired through real layers (auth, API, UI) instead of disconnected snippets.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-block size-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              <span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Traceability</span>: write notes while
                building so future-me knows why a dependency or pattern is there.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-block size-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              <span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Room to try tools</span>: new libraries get
                a honest evaluation against real constraints—not a one-file demo.
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Learning without selling yourself short
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            This project started and continues as a <span className="font-medium">learning and experimentation</span>{" "}
            space—that is not a weakness. Senior engineers still read docs daily; the difference is framing: I use this
            repo for <span className="font-medium">deliberate practice</span> with production-shaped boundaries (security,
            errors, performance), not to collect unfinished tutorials.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            If you are deciding what to put on a portfolio: honesty reads well when paired with{" "}
            <span className="font-medium">depth and documentation</span>. You can say you explore new tools here; pair it
            with what you shipped and what you learned.
          </p>
        </div>
      </section> */}

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
            ].map((tool) => (
              <span
                key={tool}
                className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
