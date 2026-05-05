"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  PaginationState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./pagination";
import { useAuditLogSearchParams } from "./search-params";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [searchParams, setSearchParams] = useAuditLogSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const eventOptions = Array.from(
    new Set(
      data
        .map((row) => {
          if (typeof row === "object" && row !== null && "event" in row) {
            const event = (row as { event?: unknown }).event;
            return typeof event === "string" ? event : "";
          }
          return "";
        })
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const statusOptions = Array.from(
    new Set(
      data
        .map((row) => {
          if (typeof row === "object" && row !== null && "status" in row) {
            const status = (row as { status?: unknown }).status;
            return typeof status === "string" ? status : "";
          }
          return "";
        })
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  if (searchParams.event && !eventOptions.includes(searchParams.event)) {
    eventOptions.unshift(searchParams.event);
  }

  if (searchParams.status && !statusOptions.includes(searchParams.status)) {
    statusOptions.unshift(searchParams.status);
  }

  const paginationState: PaginationState = {
    pageIndex: searchParams.pageIndex,
    pageSize: searchParams.pageSize,
  };

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(paginationState) : updater;
      void setSearchParams({
        pageIndex: next.pageIndex,
        pageSize: next.pageSize,
      });
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      pagination: paginationState,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={searchParams.event || "all"}
            onValueChange={(value) => {
              void setSearchParams({
                event: value === "all" ? "" : value,
                pageIndex: 0,
              });
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white">
              <SelectItem value="all">All events</SelectItem>
              {eventOptions.map((event) => (
                <SelectItem key={event} value={event}>
                  {event}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.status || "all"}
            onValueChange={(value) => {
              void setSearchParams({
                status: value === "all" ? "" : value,
                pageIndex: 0,
              });
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white">
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="Filter by user ID"
            value={searchParams.user_id || ""}
            onChange={(event) => {
              const value = event.target.value;
              void setSearchParams({
                user_id: value || "",
                pageIndex: 0,
              });
            }}
            className="w-full sm:w-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/50"
          />
        </div>

        <Button
          variant="outline"
          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          onClick={() => {
            void setSearchParams({
              event: "",
              status: "",
              user_id: "",
              pageIndex: 0,
            });
          }}
        >
          Reset filters
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-white/70 font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`skeleton-row-${index}`} className="border-white/5">
                  {columns.map((column, columnIndex) => (
                    <TableCell key={`skeleton-cell-${index}-${column.id ?? columnIndex}`} className="py-4">
                      <Skeleton className="h-5 w-full max-w-[180px] bg-white/10" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
