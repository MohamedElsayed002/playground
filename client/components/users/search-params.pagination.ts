import { parseAsIndex, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { sortCodec } from "@/lib/codecs";

const paginationParsers = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
  name: parseAsString.withDefault(""),
  sort: {
    parse: (value: string) => {
      try {
        return sortCodec.decode(value);
      } catch {
        return null;
      }
    },
    serialize: (value: { id: string; desc: boolean }) => sortCodec.encode(value),
  },
};

const paginationUrlKeys = {
  pageIndex: "page",
  pageSize: "size",
  name: "name",
  sort: "sort",
};

export function usePaginationSearchParams() {
  return useQueryStates(paginationParsers, {
    urlKeys: paginationUrlKeys,
  });
}
