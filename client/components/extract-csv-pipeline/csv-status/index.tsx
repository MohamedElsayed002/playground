"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api/client";
import { AnalyticsPanel } from "./analytics-panel";
import { CompletionPanel } from "./completion-panel";
import { StatusPanel } from "./status-panel";
import type { JobStatusResponse } from "./types";

export const CSVStatus = ({ statusId }: { statusId: string }) => {
  const { data, error, isFetching, isLoading } = useQuery<JobStatusResponse>({
    queryKey: ["job-status", statusId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${statusId}/status`);

      if (!response.ok) {
        throw new Error("Failed to load job status");
      }

      return response.json();
    },
    refetchInterval: (query) => {
      const job = query.state.data;

      if (!job) {
        return 1000;
      }

      if (job.status === "completed" || job.status === "failed" || job.progress >= 100 || job.current_step === "completed") {
        return false;
      }

      return 1000;
    },
  });

  if (isLoading) {
    return <StatusPanel job={undefined} isFetching={false} />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        Failed to load report status. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusPanel job={data} isFetching={isFetching} />
      <AnalyticsPanel job={data} />
      <CompletionPanel job={data} />
    </div>
  );
};
