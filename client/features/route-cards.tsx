"use client";

import Image from "next/image";
import type { ComponentType } from "react";
import { ArrowRight, FileSpreadsheet, FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@/components/nextjs-docs/transition-progress-layout";

const flowImages = [
  {
    title: "Checkout flow",
    description: "A step-by-step view of the checkout journey from cart to confirmation.",
    src: "/checkout-steps.png",
  },
  {
    title: "CSV extraction flow",
    description: "A visual walkthrough of the CSV upload and extraction process.",
    src: "/csv-steps.png",
  },
  {
    title: "PDF extraction flow",
    description: "A visual walkthrough of the PDF upload and extraction process.",
    src: "/pdf-pipeline-steps.png",
  },
];


function RouteCard({
  title,
  description,
  icon: Icon,
  href,
  backgroundClassName,
  label,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  backgroundClassName: string;
  label?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/10 p-6 text-white shadow-xl ${backgroundClassName}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_28%)]" />
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-black/10 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-[16rem]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/70">{label}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">{description}</p>
          </div>

          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
            <Icon className="size-7" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">

          <div />
          {href ? (
            <Button asChild variant="outline" size="icon-lg" className="size-12 border-white/20 bg-white text-black hover:bg-white/90">
              <Link href={href} aria-label={`Open ${title}`}>
                <span className="sr-only">{`Open ${title}`}</span>
                <ArrowRight className="size-5" />
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-12 border-white/15 bg-white/15 text-white opacity-70"
              disabled
            >
              <ArrowRight className="size-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RouteCards() {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold">Quick routes</h2>
          <p className="mt-2 text-sm leading-7 text-white/70">
            These are some of the biggest routes I&apos;ve worked on, and they taught me a lot about building reliable systems. I learned how to think about ACID transactions, request and response timing, and what should stay in the response versus what belongs in the background. I also learned how to optimize CPU usage for heavier traffic, how to handle batch jobs, rollbacks, and idempotency, and how to make APIs feel predictable for both users and developers.
          </p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            I&apos;m still growing in this space, especially around caching, Redis, and scaling patterns. I&apos;m also reading <span className="underline text-blue-500"><a href="https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/" target="_blank" rel="noopener noreferrer">Designing Data Intensive Applications </a></span> and trying to apply those ideas in my own projects. I&apos;m using Inngest in the background for long-running work, and I&apos;m building the full flow from backend services in NestJS and FastAPI all the way into the Next.js client so the experience feels connected end to end.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {flowImages.map((image) => (
              <Dialog key={image.title}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="group rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/10">
                        <Image src={image.src} alt={image.title} width={56} height={56} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{image.title}</p>
                        <p className="mt-1 text-xs leading-5 text-white/60">{image.description}</p>
                      </div>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl">
                  <DialogHeader>
                    <DialogTitle>{image.title}</DialogTitle>
                    <DialogDescription>{image.description}</DialogDescription>
                  </DialogHeader>
                  <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/10">
                    <Image src={image.src} alt={image.title} width={1400} height={900} className="w-full object-contain" />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <RouteCard
          title="CSV Pipeline"
          description="Upload and track your CSV reports with the full extraction workflow."
          icon={FileSpreadsheet}
          href="/extract-csv-pipeline"
          backgroundClassName="bg-[linear-gradient(135deg,_#f97316_0%,_#ea580c_40%,_#7c2d12_100%)]"
        />

        <RouteCard
          title="PDF Reports"
          description="A dedicated PDF experience is coming next for document-style workflows."
          icon={FileText}
          href="/extract-pdf-pipeline"
          backgroundClassName="bg-[linear-gradient(135deg,_#dc2626_0%,_#991b1b_45%,_#450a0a_100%)]"
        />

        <RouteCard
          title="Checkout"
          description="A checkout flow can live here when you are ready to add commerce."
          icon={ShoppingCart}
          backgroundClassName="bg-[linear-gradient(135deg,_#0f172a_0%,_#1e293b_45%,_#020617_100%)]"
          href="/small-ecommerce"
        />
      </div>
    </section>
  );
}


