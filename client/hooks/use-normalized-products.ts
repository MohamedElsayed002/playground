import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  NormalizedProductListResponse,
  ProductSortField,
  SortOrder,
} from "@/types/extract-csv-pipeline";
import { requestApiData } from "@/lib/action-result";

type UseNormalizedProductsParams = {
  jobId: string;
  limit: number;
  offset: number;
  productName?: string;
  category?: string;
  sortBy: ProductSortField;
  sortOrder: SortOrder;
};

export function useNormalizedProducts({
  jobId,
  limit,
  offset,
  productName,
  category,
  sortBy,
  sortOrder,
}: UseNormalizedProductsParams) {
  return useQuery<NormalizedProductListResponse>({
    queryKey: [
      "normalized-products",
      jobId,
      limit,
      offset,
      productName,
      category,
      sortBy,
      sortOrder,
    ],
    enabled: Boolean(jobId),
    queryFn: async () => {
      return requestApiData<NormalizedProductListResponse>(
        () => api.GET("/api/v1/jobs/{job_id}/products", {
        params: {
          path: { job_id: jobId },
          query: {
            limit,
            offset,
            product_name: productName || undefined,
            category: category || undefined,
            sort_by: sortBy,
            sort_order: sortOrder,
          },
        },
        }),
        "Unable to load normalized products right now.",
      );
    },
  });
}
