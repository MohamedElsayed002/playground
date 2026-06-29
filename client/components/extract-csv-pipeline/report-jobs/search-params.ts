import { parseAsIndex, parseAsInteger, useQueryStates } from "nuqs";

export const reportJobsParsers = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
};

export const reportJobsUrlKeys = {
  pageIndex: "page",
  pageSize: "size",
};

export function useReportJobsSearchParams() {
  return useQueryStates(reportJobsParsers, {
    urlKeys: reportJobsUrlKeys,
  });
}
