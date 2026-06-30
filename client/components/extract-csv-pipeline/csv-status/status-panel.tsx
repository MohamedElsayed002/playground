"use client";

import { FileSpreadsheet, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { StatusBadge } from "../shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { REPORT_STEPS } from "./constants";
import { formatPercent, getStepState, isJobComplete } from "./utils";
import type { JobStatusResponse } from "./types";

function StepIcon({ state }: { state: "complete" | "active" | "pending" }) {
  if (state === "complete") {
    return <CheckCircle2 className="size-4" />;
  }

  if (state === "active") {
    return <Loader2 className="size-4 animate-spin" />;
  }

  return <Circle className="size-4" />;
}

function StatusStepCard({
  title,
  description,
  targetProgress,
  state,
}: {
  title: string;
  description: string;
  targetProgress: number;
  state: "complete" | "active" | "pending";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        state === "complete" && "border-emerald-200 bg-emerald-50/80",
        state === "active" && "border-amber-300 bg-amber-50/90 shadow-sm",
        state === "pending" && "border-dashed border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            state === "complete" && "bg-emerald-600 text-white",
            state === "active" && "bg-amber-600 text-white",
            state === "pending" && "bg-slate-200 text-slate-500",
          )}
        >
          <StepIcon state={state} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs font-medium text-muted-foreground">Target: {targetProgress}%</p>
        </div>
      </div>
    </div>
  );
}

export function StatusPanel({
  job,
  isFetching,
}: {
  job?: JobStatusResponse;
  isFetching: boolean;
}) {
  const progress = job?.progress ?? 0;
  const complete = isJobComplete(job);

  if (!job) {
    return (
      <Card className="border-white/60 bg-white/80 shadow-xl shadow-amber-100/40 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-5 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-3 w-full" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-white/60 bg-white/85 shadow-xl shadow-amber-100/40 backdrop-blur-sm">
      <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-sm text-amber-900">
              <FileSpreadsheet className="size-4" />
              <span className="max-w-[24rem] truncate font-medium">{job.original_filename}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={job.status ?? "processing"} />
              <StatusBadge status={job.ingestion_status ?? "pending"} />
              {isFetching ? <span className="text-xs text-muted-foreground">Refreshing...</span> : null}
            </div>
            <CardTitle className="text-2xl md:text-3xl">
              {complete ? "Your report is ready" : "Your report is being prepared"}
            </CardTitle>
            <CardDescription className="max-w-2xl text-base">
              We are processing <span className="font-medium text-foreground">{job.original_filename}</span> and turning
              it into a readable report with clean analytics.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 text-sm shadow-sm">
            <p className="text-muted-foreground">Current step</p>
            <p className="font-semibold capitalize">{job.current_step?.replaceAll("_", " ") ?? "processing"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatPercent(progress)} complete</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Progress</span>
            <span className="font-semibold">{formatPercent(progress)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {REPORT_STEPS.map((step, index) => (
            <StatusStepCard
              key={step.title}
              title={step.title}
              description={step.description}
              targetProgress={step.progress}
              state={getStepState(job, index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
