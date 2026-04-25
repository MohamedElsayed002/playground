"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { ProductsResponse } from "@/types/openapi-typescript";
import { ProductQueryParams } from "./use-product-query-params";

export function useProducts(query: ProductQueryParams) {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const response = await api.GET("/api/v1/products", {
          params: {
            query: {
              search: query.search || undefined,
              category_id: query.category_id || undefined,
              featured: query.featured,
              page: query.page,
              page_size: query.page_size,
            },
          },
        });

        if (response.error) {
          setError("Failed to fetch products.");
          return;
        }

        if (response.data) {
          setData(response.data);
        }
      } catch {
        setError("Network error while fetching products.");
      }
    };

    void fetchData();
  }, [query.search, query.category_id, query.featured, query.page, query.page_size]);

  return { data, error };
}
