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
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  PaginationState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTablePagination } from "./pagination";
import { useDeleteUser } from "@/hooks/use-users";
import { sileo } from "sileo";
import { usePaginationSearchParams } from "./search-params.pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [searchParams, setSearchParams] = usePaginationSearchParams();
  const [sorting, setSorting] = useState<SortingState>(
    searchParams.sort ? [searchParams.sort] : [],
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "name", value: searchParams.name },
  ]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [rowSelection, setRowSelection] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState("");
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();
  const paginationState: PaginationState = {
    pageIndex: searchParams.pageIndex,
    pageSize: searchParams.pageSize,
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // For pagination
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(paginationState) : updater;
      void setSearchParams({
        pageIndex: next.pageIndex,
        pageSize: next.pageSize,
      });
    },

    // Sorting
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);

      void setSearchParams({
        sort: next[0] ?? null,
        pageIndex: 0,
      });
    },
    getSortedRowModel: getSortedRowModel(),

    // Filter
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnFilters) : updater;
      setColumnFilters(next);

      const nameFilter = next.find((filter) => filter.id === "name");
      void setSearchParams({
        name: typeof nameFilter?.value === "string" ? nameFilter.value : "",
        pageIndex: 0,
      });
    },
    getFilteredRowModel: getFilteredRowModel(),

    // Visibility
    onColumnVisibilityChange: setColumnVisibility,

    // Row selected
    onRowSelectionChange: setRowSelection,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: paginationState,
    },
    meta: {
      onRequestDeleteUser: (id: string, label?: string) => {
        setPendingDeleteIds([id]);
        setPendingDeleteLabel(label ?? "this user");
        setIsDeleteDialogOpen(true);
      },
    },
  });

  const selectedUsers = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

  const handleBulkDelete = () => {
    if (!selectedUsers.length) return;

    const ids = selectedUsers.map((user) => user.id);
    setPendingDeleteIds(ids);
    setPendingDeleteLabel(`${ids.length} selected user(s)`);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteIds.length) return;
    try {
      for (const id of pendingDeleteIds) {
        await deleteUser(id);
      }
      setRowSelection({});
      sileo.success({ title: `Deleted ${pendingDeleteIds.length} user(s)` });
      setIsDeleteDialogOpen(false);
      setPendingDeleteIds([]);
      setPendingDeleteLabel("");
    } catch {
      sileo.error({ title: "Failed to delete user(s)" });
    }
  };

  return (
    <div>
      {/* Confirm Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {pendingDeleteLabel}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center py-4">
        <Input
          placeholder="Filter names..."
          value={searchParams.name}
          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        {selectedUsers.length > 0 && (
          <Button
            variant="destructive"
            className="ml-2"
            disabled={!selectedUsers.length || isDeleting}
            onClick={handleBulkDelete}
          >
            Delete selected ({selectedUsers.length})
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
