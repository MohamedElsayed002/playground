import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { NormalizedProduct } from "@/types/extract-csv-pipeline";
import { requestApiData } from "@/lib/action-result";

type UseNormalizedProductParams = {
  jobId: string;
  productId: string;
};

export function useNormalizedProduct({ jobId, productId }: UseNormalizedProductParams) {
  return useQuery<NormalizedProduct>({
    queryKey: ["normalized-product", jobId, productId],
    enabled: Boolean(jobId && productId),
    queryFn: async () => {
      return requestApiData<NormalizedProduct>(
        () => api.GET("/api/v1/jobs/{job_id}/products/{product_id}", {
        params: {
          path: {
            job_id: jobId,
            product_id: productId,
          },
        },
        }),
        "Unable to load this product right now.",
      );
    },
  });
}
