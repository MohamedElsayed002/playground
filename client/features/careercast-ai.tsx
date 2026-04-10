"use client"

import { CodeEditor } from "@/components/chategy/code-editor"
import { cvReviewerFreeExample, cvReviewerProExample, jobTailorFreeExample, jobTailorProExample } from "@/constants/data"
import { useHotkey } from "@tanstack/react-hotkeys"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"


export default function CareercastAI() {
    const router = useRouter()

    useHotkey('Control+Space', () => {
        router.push('/')
      })

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <span onClick={() => router.push('/')} className="flex gap-4 cursor-pointer my-5">
          <ArrowLeft size={20} />
          Back / Ctrl+Space
        </span>
          {/* Hero */}
          <section className="rounded-2xl border bg-linear-to-b from-zinc-50 to-white p-8 shadow-sm dark:from-zinc-950 dark:to-zinc-950/60">
            <p className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur dark:bg-zinc-950/60 dark:text-zinc-300">
              Next.js 15 • tRPC • Prisma • Better Auth • Inngest
            </p>
  
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              CareerCastAI
            </h1>
            <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              A platform with 3 AI services: <span className="font-medium">Podcast Generator</span>,{" "}
              <span className="font-medium">CV Reviewer</span>, and{" "}
              <span className="font-medium">Job Application Tailor</span>.
              I built it to turn “prompt → real output” into a reliable pipeline: audio, PDFs, and a
              cover image — with safe retries when something fails.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              The platform follows a SaaS model with <span className="font-medium">Better Auth</span> for secure access,
              <span className="font-medium"> Polar</span> for payments, and premium features for Pro members.
            </p>
  
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-white/70 p-4 backdrop-blur dark:bg-zinc-950/50">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">🎙️ Podcast Generator</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Debate-style script, TTS audio, cover image, and PDFs.
                </p>
              </div>
              <div className="rounded-xl border bg-white/70 p-4 backdrop-blur dark:bg-zinc-950/50">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">📄 CV Reviewer</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Match scoring, strengths, gaps, and actionable recommendations.
                </p>
              </div>
              <div className="rounded-xl border bg-white/70 p-4 backdrop-blur dark:bg-zinc-950/50">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">🪄 Job Application Tailor</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Tailors CV + cover letter without fabricating experience.
                </p>
              </div>
            </div>
          </section>
  
        {/* Story + goals */}
        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              The story behind the Podcast Generator
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              I was trying to improve my English by watching YouTube channels that publish “podcast”
              style videos. After a while, I noticed a pattern: the voices sounded synthetic, the
              pacing felt generated, and the scripts + PDF resources looked AI-produced.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              That turned into a challenge:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                can I build a system that generates a full podcast experience end-to-end
              </span>
              — audio, a clean PDF, and a strong thumbnail like YouTube… and then make it more
              reliable and better structured?
            </p>
          </div>
  
          <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              What I optimized for
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex gap-3">
                <span className="mt-1 inline-block size-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Quality outputs</span>: debate-style
                  structure, readable PDFs, and a cover image that fits the topic.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-block size-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Reliability</span>: background jobs with
                  retries so partial failures don’t ruin the whole generation.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-block size-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Clear UX</span>: simple form → trackable
                  progress → deliverables you can download and share.
                </span>
              </li>
            </ul>
          </div>
        </section>
  
        {/* Workflow */}
        <section className="mt-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Podcast generation workflow
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              The generator runs as a pipeline. If something fails (LLM, TTS, upload, PDF), it’s retried{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">up to 3 times</span> using Inngest retry
              policies.
            </p>
          </div>
  
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <figure className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-950">
              <div className="overflow-hidden rounded-xl border bg-zinc-50 dark:bg-zinc-900">
                <Image
                  src="/podcast-steps.png"
                  width={1400}
                  height={800}
                  className="h-auto w-full"
                  alt="Podcast generating steps diagram"
                  priority
                />
              </div>
              <figcaption className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                High-level steps: fetch user + credentials → generate debate → optional summary → audio → PDF → save → notify.
              </figcaption>
            </figure>
  
            <figure className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-950">
              <div className="overflow-hidden rounded-xl border bg-zinc-50 dark:bg-zinc-900">
                <Image
                  src="/inngest-podcast.png"
                  width={1400}
                  height={800}
                  className="h-auto w-full"
                  alt="Inngest run timeline for podcast generation"
                />
              </div>
              <figcaption className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                Inngest timeline: observable execution + retries (3 attempts) when a function fails.
              </figcaption>
            </figure>
          </div>
  
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Two PDF modes (based on duration)</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                If the podcast is longer (5/10/20 minutes), the app generates a{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">detailed PDF</span> with the summary and
                supporting structure. If it’s a 1-minute podcast, it produces a{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">simple script PDF</span> only.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Why background jobs matter here</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                Podcast generation touches multiple external services (LLM, TTS, image generation, uploads). Running this
                work in a job queue keeps the UI fast and makes failures recoverable instead of frustrating.
              </p>
            </div>
          </div>
  
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Sample outputs (PDF)</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                Here are two real PDFs generated by the pipeline — one for longer audio (detailed), and one for the 1-minute
                mode (script-only).
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  href="https://x00zgx6o26.ufs.sh/f/mKUaycPGkZo334pAvoRQoWpn8wH7bZa2XDJxzvA69g4ejIYq"
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-xl border bg-zinc-50 p-4 transition hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-900/70"
                >
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Detailed PDF</p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">For 5/10/20-minute podcasts</p>
                  <p className="mt-3 text-xs font-medium text-zinc-900 underline underline-offset-4 group-hover:opacity-80 dark:text-zinc-100">
                    Open PDF →
                  </p>
                </a>
  
                <a
                  href="https://x00zgx6o26.ufs.sh/f/mKUaycPGkZo3RIffzHOw0z6iPyWSo53DlfZuqOaGR8BxjVMk"
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-xl border bg-zinc-50 p-4 transition hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-900/70"
                >
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Script-only PDF</p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">For 1-minute podcasts</p>
                  <p className="mt-3 text-xs font-medium text-zinc-900 underline underline-offset-4 group-hover:opacity-80 dark:text-zinc-100">
                    Open PDF →
                  </p>
                </a>
              </div>
            </div>
  
            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Build log (3 YouTube videos)</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                I recorded my approach in a short series and keep improving the project over time.
              </p>
              <div className="mt-4 grid gap-3">
                <a
                  href="https://www.youtube.com/watch?v=JXuGlvRHUUs&t=21s"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border bg-red-500 text-white px-4 py-3 text-sm font-medium  transition hover:opacity-80 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
                >
                  Video 1: Overview AI Podcast Generator→
                </a>
                <a
                  href="https://www.youtube.com/watch?v=b3xdqGPyZJE&t=31s"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border bg-red-500 px-4 py-3 text-sm font-medium text-white transition hover:opacity-80 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
                >
                  Video 2: AI Podcast Generator Website →
                </a>
                <a
                  href="https://www.youtube.com/watch?v=_PPETisc1pY&t=33s"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border bg-red-500 px-4 py-3 text-sm font-medium text-white transition hover:opacity-80 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
                >
                  Video 3: CarrerCareer AI & AI Podcast Generator →
                </a>
              </div>
            </div>
          </div>
        </section>
  
        {/* Services preview (visual) */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            The 3 main services
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            CareerCastAI isn’t just one feature — it’s a set of focused workflows that ship real deliverables.
          </p>
  
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <figure className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-950">
              <div className="overflow-hidden rounded-xl border bg-zinc-50 dark:bg-zinc-900">
                <Image
                  src="/cv-reviewer.png"
                  width={1400}
                  height={800}
                  className="h-auto w-full"
                  alt="CV reviewer screenshots"
                />
              </div>
              <figcaption className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                CV Reviewer: match scoring, strengths, missing skills, and improvement recommendations.
              </figcaption>
            </figure>
  
            <figure className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-950">
              <div className="overflow-hidden rounded-xl border bg-zinc-50 dark:bg-zinc-900">
                <Image
                  src="/job-application-tailor.png"
                  width={1400}
                  height={800}
                  className="h-auto w-full"
                  alt="Job application tailor screenshots"
                />
              </div>
              <figcaption className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                Job Application Tailor: rewrite + reorder content for the target role (no fabricated experience).
              </figcaption>
            </figure>
          </div>
        </section>
  
        {/* CV Reviewer + Tailor deep dive */}
        <section className="mt-12">
          <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              CV Reviewer & Job Application Tailor
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              This part came from a real pain point: getting rejected many times. I wanted an ATS-style
              signal to answer one question quickly: <span className="font-medium text-zinc-900 dark:text-zinc-100">am I a good candidate for this role?</span>
              {" "}Then I expanded that idea into full job-application tailoring with deeper guidance,
              optional cover letter generation, and richer analysis for Pro users.
            </p>
  
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-zinc-50 p-5 dark:bg-zinc-900/60">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">CV Reviewer: Free response</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Focused, high-signal feedback to show value quickly.
                </p>
                <CodeEditor
                  lang="json"
                  title="cv-review.free.json"
                  copyButton
                  writing={false}
                  className="mt-3 h-[380px] w-full"
                >
                  {cvReviewerFreeExample}
                </CodeEditor>
              </div>
  
              <div className="rounded-xl border bg-zinc-50 p-5 dark:bg-zinc-900/60">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">CV Reviewer: Pro response</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Deep assessment with weaknesses, recommendations, and experience matching.
                </p>
                <CodeEditor
                  lang="json"
                  title="cv-review.pro.json"
                  copyButton
                  writing={false}
                  className="mt-3 h-[380px] w-full"
                >
                  {cvReviewerProExample}
                </CodeEditor>
              </div>
            </div>
  
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-zinc-50 p-5 dark:bg-zinc-900/60">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Job Tailor: Free response</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Limited tailoring to demonstrate results while keeping premium depth locked.
                </p>
                <CodeEditor
                  lang="json"
                  title="job-tailor.free.json"
                  copyButton
                  writing={false}
                  className="mt-3 h-[380px] w-full"
                >
                  {jobTailorFreeExample}
                </CodeEditor>
              </div>
  
              <div className="rounded-xl border bg-zinc-50 p-5 dark:bg-zinc-900/60">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Job Tailor: Pro response</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Complete tailoring with ATS breakdown, change tracking, and optional cover letter.
                </p>
                <CodeEditor
                  lang="json"
                  title="job-tailor.pro.json"
                  copyButton
                  writing={false}
                  className="mt-3 h-[380px] w-full"
                >
                  {jobTailorProExample}
                </CodeEditor>
              </div>
            </div>
          </div>
        </section>
  
        {/* Links + stack */}
        <section className="mt-12">
          <div className="rounded-2xl border bg-white p-7 shadow-sm dark:bg-zinc-950">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Source, demo, and stack
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              If you want to explore the codebase or try the app, here are the direct links.
            </p>
  
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href="https://github.com/MohamedElsayed002/careercast-ai"
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border bg-zinc-50 p-4 transition hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-900/70"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Code source (GitHub)</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Repository: careercast-ai
                </p>
                <p className="mt-3 text-xs font-medium text-zinc-900 underline underline-offset-4 group-hover:opacity-80 dark:text-zinc-100">
                  Open repository →
                </p>
              </a>
  
              <a
                href="https://careercast-ai-mu.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border bg-zinc-50 p-4 transition hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-900/70"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Live demo</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Try the app on Vercel
                </p>
                <p className="mt-3 text-xs font-medium text-zinc-900 underline underline-offset-4 group-hover:opacity-80 dark:text-zinc-100">
                  Open demo →
                </p>
              </a>
            </div>
  
            <h3 className="mt-8 text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Tools used
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "TypeScript",
                "Next.js",
                "Sentry",
                "Neon",
                "PostgreSQL",
                "Prisma",
                "tRPC",
                "OpenAI",
                "Vercel AI SDK",
                "Better Auth",
                "Polar",
                "Inngest",
                "UploadThing",
                "Webhook",
                "Framer Motion",
                "Ngrok",
                "CoderabbitAI",
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
    )
}