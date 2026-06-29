"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "../shared/data-table-pagination";
import { useReportJobsSearchParams } from "./search-params";

interface ReportJobsDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  totalItems: number;
  isLoading?: boolean;
}

export function ReportJobsDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  totalItems,
  isLoading = false,
}: ReportJobsDataTableProps<TData, TValue>) {
  const [searchParams, setSearchParams] = useReportJobsSearchParams();

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
    state: {
      pagination: paginationState,
    },
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-background/80 shadow-sm backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`report-job-skeleton-${index}`}>
                  {columns.map((column, columnIndex) => (
                    <TableCell key={`report-job-skeleton-cell-${index}-${column.id ?? columnIndex}`}>
                      <Skeleton className="h-5 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No report jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} totalItems={totalItems} />
    </div>
  );
}
