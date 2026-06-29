import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  NormalizedProductListResponse,
  ProductSortField,
  SortOrder,
} from "@/types/extract-csv-pipeline";

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
      const { data, error } = await api.GET("/api/v1/jobs/{job_id}/products", {
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
      });

      if (error || !data) {
        throw error ?? new Error("Failed to fetch normalized products");
      }

      return data;
    },
  });
}
