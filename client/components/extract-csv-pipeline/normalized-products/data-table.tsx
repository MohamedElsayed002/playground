"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
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
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "../shared/data-table-pagination";
import { useNormalizedProductsSearchParams } from "./search-params";
import type { ProductSortField, SortOrder } from "@/types/extract-csv-pipeline";

interface NormalizedProductsDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  totalItems: number;
  isLoading?: boolean;
}

export function NormalizedProductsDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  totalItems,
  isLoading = false,
}: NormalizedProductsDataTableProps<TData, TValue>) {
  const [searchParams, setSearchParams] = useNormalizedProductsSearchParams();

  const sorting: SortingState = searchParams.sort_by
    ? [{ id: searchParams.sort_by, desc: searchParams.sort_order === "desc" }]
    : [];

  const paginationState: PaginationState = {
    pageIndex: searchParams.pageIndex,
    pageSize: searchParams.pageSize,
  };

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(paginationState) : updater;
      void setSearchParams({
        pageIndex: next.pageIndex,
        pageSize: next.pageSize,
      });
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const activeSort = next[0];

      void setSearchParams({
        sort_by: (activeSort?.id as ProductSortField | undefined) ?? "price",
        sort_order: activeSort?.desc ? "desc" : "asc",
        pageIndex: 0,
      });
    },
    state: {
      sorting,
      pagination: paginationState,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Filter by product name"
            value={searchParams.product_name}
            onChange={(event) => {
              void setSearchParams({
                product_name: event.target.value,
                pageIndex: 0,
              });
            }}
            className="max-w-sm bg-background"
          />
          <Input
            placeholder="Filter by category"
            value={searchParams.category}
            onChange={(event) => {
              void setSearchParams({
                category: event.target.value,
                pageIndex: 0,
              });
            }}
            className="max-w-sm bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={searchParams.sort_by}
            onValueChange={(value) => {
              void setSearchParams({
                sort_by: value as ProductSortField,
                pageIndex: 0,
              });
            }}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="product_name">Product Name</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.sort_order}
            onValueChange={(value) => {
              void setSearchParams({
                sort_order: value as SortOrder,
                pageIndex: 0,
              });
            }}
          >
            <SelectTrigger className="w-[120px] bg-background">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              void setSearchParams({
                product_name: "",
                category: "",
                sort_by: "price",
                sort_order: "asc",
                pageIndex: 0,
              });
            }}
          >
            Reset
          </Button>
        </div>
      </div>

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
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`product-skeleton-${index}`}>
                  {columns.map((column, columnIndex) => (
                    <TableCell key={`product-skeleton-cell-${index}-${column.id ?? columnIndex}`}>
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
                  No normalized products found.
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
