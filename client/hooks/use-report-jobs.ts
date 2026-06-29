import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ReportJobListResponse } from "@/types/extract-csv-pipeline";

type UseReportJobsParams = {
  limit: number;
  offset: number;
};

export function useReportJobs({ limit, offset }: UseReportJobsParams) {
  return useQuery<ReportJobListResponse>({
    queryKey: ["report-jobs",limit, offset],
    enabled: 3 > 0,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/users/{user_id}/report-jobs", {
        params: {
          path: { user_id: 3 },
          query: { limit, offset },
        },
      });

      if (error || !data) {
        throw error ?? new Error("Failed to fetch report jobs");
      }

      return data as ReportJobListResponse;
    },
  });
}
