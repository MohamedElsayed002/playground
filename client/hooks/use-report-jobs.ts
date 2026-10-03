import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ReportJobListResponse } from "@/types/extract-csv-pipeline";
import { requestApiData } from "@/lib/action-result";

type UseReportJobsParams = {
  limit: number;
  offset: number;
};

export function useReportJobs({ limit, offset }: UseReportJobsParams) {
  return useQuery<ReportJobListResponse>({
    queryKey: ["report-jobs", limit, offset],
    enabled: 3 > 0,
    queryFn: async () => {
      return (await requestApiData(
        () => api.GET("/api/v1/users/{user_id}/report-jobs", {
        params: {
          path: { user_id: 3 },
          query: { limit, offset },
        },
        }),
        "Unable to load report jobs right now.",
      )) as ReportJobListResponse;
    },
  });
}
