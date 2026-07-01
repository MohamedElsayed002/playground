import type { Metadata } from "next";
import { Suspense } from "react";
import ReportJobsView from "@/components/extract-csv-pipeline/report-jobs";

export const metadata: Metadata = {
  title: "Extract CSV Pipeline",
  description: "Review CSV extraction jobs and normalized products.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading report jobs...</div>}>
      <ReportJobsView />
    </Suspense>
  );
}
