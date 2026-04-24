import { parseAsIndex, parseAsInteger, parseAsString, useQueryStates } from "nuqs";

const paginationParsers = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
  name: parseAsString.withDefault(""),
};

const paginationUrlKeys = {
  pageIndex: "page",
  pageSize: "perPage",
  name: "name",
};

export function usePaginationSearchParams() {
  return useQueryStates(paginationParsers, {
    urlKeys: paginationUrlKeys,
  });
}