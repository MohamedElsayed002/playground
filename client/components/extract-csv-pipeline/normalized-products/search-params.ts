import { parseAsIndex, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import type { ProductSortField, SortOrder } from "@/types/extract-csv-pipeline";

const sortFields = ["price", "product_name", "category"] as const satisfies readonly ProductSortField[];
const sortOrders = ["asc", "desc"] as const satisfies readonly SortOrder[];

export const normalizedProductsParsers = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize: parseAsInteger.withDefault(20),
  product_name: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  sort_by: parseAsStringLiteral(sortFields).withDefault("price"),
  sort_order: parseAsStringLiteral(sortOrders).withDefault("asc"),
};

export const normalizedProductsUrlKeys = {
  pageIndex: "page",
  pageSize: "size",
  product_name: "name",
  category: "category",
  sort_by: "sortBy",
  sort_order: "sortOrder",
};

export function useNormalizedProductsSearchParams() {
  return useQueryStates(normalizedProductsParsers, {
    urlKeys: normalizedProductsUrlKeys,
  });
}
