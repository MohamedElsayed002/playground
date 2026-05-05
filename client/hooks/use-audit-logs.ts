import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { api } from "@/lib/api/client";
import type { PaginatedAuditLogs } from "@/types/audit-log";
import type { components } from "@/lib/api/schema";

type FastApiAuditLog = components["schemas"]["AuditLogResponse"];
type AuditSource = "nestjs" | "fastapi";

// Fetch NestJS audit logs
const fetchNestJSAuditLogs = async (params: {
  page?: number;
  page_size?: number;
  event?: string | null;
  status?: string | null;
  user_id?: string | null;
}): Promise<PaginatedAuditLogs> => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.event) query.set("event", params.event);
  if (params.status) query.set("status", params.status);
  if (params.user_id) query.set("user_id", params.user_id);

  try {
    const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit-logs?${query.toString()}`);
    const json = await data.json()
    console.log('json',json)
    return json as PaginatedAuditLogs;
  } catch (error) {
    console.error("[NestJS Audit Logs] Fetch failed:", error);
    throw error;
  }
};

// Fetch FastAPI audit logs
const fetchFastAPIAuditLogs = async (params: {
  page?: number;
  page_size?: number;
  event?: string | null;
  status?: string | null;
  user_id?: string | null;
}): Promise<PaginatedAuditLogs> => {
  const userIdAsNumber = params.user_id ? Number(params.user_id) : null;

  try {
    const { data, error } = await api.GET("/api/v1/audit-logs/", {
      params: {
        query: {
          page: params.page,
          page_size: params.page_size,
          event: params.event ?? undefined,
          status: params.status ?? undefined,
          user_id: Number.isNaN(userIdAsNumber) ? undefined : userIdAsNumber ?? undefined,
        },
      },
    });

    if (error || !data) {
      console.error("[FastAPI Audit Logs] API error:", error);
      throw error ?? new Error("Failed to fetch FastAPI audit logs");
    }

    return {
      ...data,
      items: data.items.map((item: FastApiAuditLog) => ({
        id: String(item.id),
        event: item.event,
        user_id: item.user_id === null ? null : String(item.user_id),
        status: item.status,
        ip_address: item.ip_address,
        user_agent: item.user_agent,
        extra: item.extra ?? null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
    };
  } catch (error) {
    console.error("[FastAPI Audit Logs] Fetch failed:", error);
    throw error;
  }
};

export const useAuditLogs = (params: {
  source: AuditSource;
  page?: number;
  page_size?: number;
  event?: string | null;
  status?: string | null;
  user_id?: string | null;
}) => {
  return useQuery<PaginatedAuditLogs>({
    queryKey: ["audit-logs", params.source, params],
    queryFn: async () => {
      if (params.source === "nestjs") {
        return fetchNestJSAuditLogs(params);
      } else {
        return fetchFastAPIAuditLogs(params);
      }
    },
  });
};
