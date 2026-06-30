"use client";

import type { ComponentType } from "react";
import { ArrowRight, FileSpreadsheet, FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/nextjs-docs/transition-progress-layout";

function RouteCard({
  title,
  description,
  icon: Icon,
  href,
  backgroundClassName,
  label,
  disabled = false,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  backgroundClassName: string;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/10 p-6 text-white shadow-xl ${backgroundClassName}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_28%)]" />
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

          <div/>
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
          <p className="mt-2 text-sm text-white/70">Jump straight into the parts of the app the user needs most.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <RouteCard
          title="CSV Pipeline"
          description="Upload and track your CSV reports with the full extraction workflow."
          icon={FileSpreadsheet}
          href="/extract-csv-pipeline"
          // label="Active route"
          backgroundClassName="bg-[linear-gradient(135deg,_#f97316_0%,_#ea580c_40%,_#7c2d12_100%)]"
        />

        <RouteCard
          title="PDF Reports"
          description="A dedicated PDF experience is coming next for document-style workflows."
          icon={FileText}
          // label="Planned route"
          backgroundClassName="bg-[linear-gradient(135deg,_#dc2626_0%,_#991b1b_45%,_#450a0a_100%)]"
          disabled
        />

        <RouteCard
          title="Checkout"
          description="A checkout flow can live here when you are ready to add commerce."
          icon={ShoppingCart}
          // label="Planned route"
          backgroundClassName="bg-[linear-gradient(135deg,_#0f172a_0%,_#1e293b_45%,_#020617_100%)]"
          disabled
        />
      </div>
    </section>
  );
}
