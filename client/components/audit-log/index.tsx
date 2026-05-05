"use client";

import { useEffect, useState } from "react";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useAuditLogSearchParams } from "./search-params";
import { AlertCircle, ShieldCheck } from "lucide-react";

interface AuditLogsTableProps {
  source: "nestjs" | "fastapi";
}

export default function AuditLogsTable({ source }: AuditLogsTableProps) {
  const [searchParams] = useAuditLogSearchParams();
  const [debouncedParams, setDebouncedParams] = useState(searchParams);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedParams(searchParams);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  const isDebouncing =
    debouncedParams.event !== searchParams.event ||
    debouncedParams.status !== searchParams.status ||
    debouncedParams.user_id !== searchParams.user_id ||
    debouncedParams.pageIndex !== searchParams.pageIndex ||
    debouncedParams.pageSize !== searchParams.pageSize;

  const { data, isLoading, error } = useAuditLogs({
    source,
    page: debouncedParams.pageIndex + 1,
    page_size: debouncedParams.pageSize,
    event: debouncedParams.event || null,
    status: debouncedParams.status || null,
    user_id: debouncedParams.user_id || null,
  });

  const logs = data?.items ?? [];
  const totalItems = data?.total ?? 0;
  const pageCount = Math.ceil(totalItems / debouncedParams.pageSize);

  return (
    <div className="container mx-auto py-12 px-4 space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary/80">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-widest uppercase">System Audit</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Activity Logs
          </h1>
          <p className="text-white/50 mt-2 text-lg">
            {source === "nestjs"
              ? "NestJS audit logs for internal platform events."
              : "FastAPI audit logs for ecommerce platform events."}
          </p>
        </div>

        {/* Public Page Note */}
        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl max-w-sm backdrop-blur-md">
          <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-tight">Public Access Enabled</h4>
            <p className="text-xs text-blue-300/80 mt-1 leading-relaxed">
              Source: {source === "nestjs" ? "NestJS" : "FastAPI"}.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 p-8 rounded-2xl text-center">
          <p className="text-destructive font-medium">Failed to load audit logs. Please try again later.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={logs} pageCount={pageCount} isLoading={isLoading || isDebouncing} />
      )}
    </div>
  );
}
