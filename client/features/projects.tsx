"use client";
import { ArrowRight } from "lucide-react";
import { HoverPrefetchLink } from "@/components/nextjs-docs/hover-prefetch-link";

export function Projects() {
  return (
    <div>
      <h2 className="text-3xl font-semibold mb-4 md:text-left text-center">Projects</h2>
      <p className="text-gray-400 -mt-2 mb-5">My Projects & my stack used in them</p>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-38">
        <div className="w-full md:w-[371px]  h-[188px] text-black bg-white rounded-4xl p-5 flex flex-col justify-between">
          <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">CareerCast AI</h1>
          <p className="text-sm lg:text-base opacity-85 max-w-[240px] -mt-8">
            Podcast Generator, CV Reviewer, Job Application Tailor
          </p>
          <div className="flex justify-between items-center">
            <div />
            <HoverPrefetchLink
              href="/projects/careercast-ai"
              ariaLabel="Open CareerCast AI project"
              className="inline-flex size-10 items-center justify-center rounded-md border bg-background text-black shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <span className="sr-only">Open CareerCast AI project</span>
              <span aria-hidden="true">
                <ArrowRight className="text-black" size={24} />
              </span>
            </HoverPrefetchLink>
          </div>
        </div>
        <div className="w-full md:w-[371px]  h-[188px] bg-[radial-gradient(circle_at_top,_#065f46_0%,_#022c22_40%,_#020617_100%)] rounded-4xl p-5 flex flex-col justify-between">
          <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">Playground</h1>
          <p className="text-sm lg:text-base opacity-85 max-w-[240px] -mt-8">
            Performance & System Engineering Lab
          </p>
          <div className="flex justify-between items-center">
            <div />
            <HoverPrefetchLink
              href="/projects/playground"
              ariaLabel="Open Playground project"
              className="inline-flex size-10 items-center justify-center rounded-md border bg-background text-black shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <span className="sr-only">Open Playground project</span>
              <span aria-hidden="true">
                <ArrowRight className="text-black" size={24} />
              </span>
            </HoverPrefetchLink>
          </div>
        </div>
        <div className="w-full md:w-[371px]  h-[188px]  bg-[#FDF3E9] text-black rounded-4xl p-5 flex flex-col justify-between">
          <h1 className="text-lg lg:text-3xl font-medium leading-tight mb-1">Flower Obsession</h1>
          <p className="text-sm lg:text-base opacity-85 max-w-[240px] -mt-3">
            E-commerce Flower shop billingual (Arabic & Enlgish)
          </p>
          <div className="flex justify-between items-center">
            <div />
            <HoverPrefetchLink
              href="/projects/flower-obsession"
              ariaLabel="Open Flower Obsession project"
              className="inline-flex size-10 items-center justify-center rounded-md border bg-background text-black shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <span className="sr-only">Open Flower Obsession project</span>
              <span aria-hidden="true">
                <ArrowRight className="text-black" size={24} />
              </span>
            </HoverPrefetchLink>
          </div>
        </div>
      </div>
    </div>
  );
}
