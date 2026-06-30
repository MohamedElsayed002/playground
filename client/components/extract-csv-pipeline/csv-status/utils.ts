import { REPORT_STEPS } from "./constants";
import type { JobStatusResponse, ReportMetric } from "./types";

export function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

export function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat().format(value ?? 0);
}

export function formatOptionalCount(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : formatCount(value);
}

export function isJobComplete(job?: JobStatusResponse) {
  if (!job) {
    return false;
  }

  return job.status === "completed" || job.progress >= 100 || job.current_step === "completed";
}

export function getActiveStepIndex(job?: JobStatusResponse) {
  if (!job) {
    return 0;
  }

  if (isJobComplete(job)) {
    return REPORT_STEPS.length - 1;
  }

  return Math.max(0, Math.min(REPORT_STEPS.length - 1, Math.ceil(job.progress / 10) - 1));
}

export function getStepState(job: JobStatusResponse | undefined, index: number) {
  const activeIndex = getActiveStepIndex(job);

  if (isJobComplete(job)) {
    return "complete" as const;
  }

  if (index < activeIndex) {
    return "complete" as const;
  }

  if (index === activeIndex) {
    return "active" as const;
  }

  return "pending" as const;
}

export function buildAnalytics(job?: JobStatusResponse): ReportMetric[] {
  return [
    { label: "Total rows", value: formatCount(job?.total_rows), hint: "Rows detected in the source file" },
    { label: "Valid rows", value: formatCount(job?.valid_rows), hint: "Rows ready for ingestion" },
    { label: "Invalid rows", value: formatCount(job?.invalid_rows), hint: "Rows that need attention" },
    { label: "Ingested rows", value: formatCount(job?.ingested_rows), hint: "Rows saved into the report" },
    { label: "Quality score", value: `${formatOptionalCount(job?.quality_score)}%`, hint: "Validation score for this file" },
    {
      label: "Issues found",
      value: formatCount((job?.invalid_price ?? 0) + (job?.invalid_quantity ?? 0) + (job?.invalid_dates ?? 0)),
      hint: "Price, quantity, and date checks",
    },
  ];
}
