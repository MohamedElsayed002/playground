import { parseAsIndex, parseAsInteger, parseAsString, useQueryStates } from "nuqs";

export const auditLogParsers = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
  event: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  user_id: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};

export const auditLogUrlKeys = {
  pageIndex: "page",
  pageSize: "size",
  event: "event",
  status: "status",
  user_id: "user_id",
};

export function useAuditLogSearchParams() {
  return useQueryStates(auditLogParsers, {
    urlKeys: auditLogUrlKeys,
  });
}
