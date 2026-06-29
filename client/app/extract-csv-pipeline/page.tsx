import type { Metadata } from "next";
import ReportJobsView from "@/components/extract-csv-pipeline/report-jobs";

export const metadata: Metadata = {
  title: "Extract CSV Pipeline",
  description: "Review CSV extraction jobs and normalized products.",
};

export default function Page() {
  return <ReportJobsView />;
}
