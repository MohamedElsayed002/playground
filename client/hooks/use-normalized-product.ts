import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { NormalizedProduct } from "@/types/extract-csv-pipeline";

type UseNormalizedProductParams = {
  jobId: string;
  productId: string;
};

export function useNormalizedProduct({ jobId, productId }: UseNormalizedProductParams) {
  return useQuery<NormalizedProduct>({
    queryKey: ["normalized-product", jobId, productId],
    enabled: Boolean(jobId && productId),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/jobs/{job_id}/products/{product_id}", {
        params: {
          path: {
            job_id: jobId,
            product_id: productId,
          },
        },
      });

      if (error || !data) {
        throw error ?? new Error("Failed to fetch normalized product");
      }

      return data;
    },
  });
}
