"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/users/data-table-column-header";
import type { NormalizedProduct } from "@/types/extract-csv-pipeline";

export function createNormalizedProductColumns(jobId: string): ColumnDef<NormalizedProduct>[] {
  return [
    {
      accessorKey: "product_id",
      header: "Product ID",
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("product_id")}</span>,
    },
    {
      accessorKey: "product_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("product_name")}</span>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => row.getValue("category") || "—",
    },
    {
      accessorKey: "price",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => {
        const price = Number(row.getValue("price"));
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
        }).format(Number.isFinite(price) ? price : 0);
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
    },
    {
      accessorKey: "last_restock_date",
      header: "Last Restock",
      cell: ({ row }) => {
        const value = row.getValue("last_restock_date") as string | null | undefined;
        if (!value) return "—";
        return format(new Date(value), "PP");
      },
    },
    {
      id: "actions",
      header: "Details",
      cell: ({ row }) => (
        <Button asChild variant="outline" size="sm">
          <Link href={`/extract-csv-pipeline/normalized-products/${jobId}/${row.original.id}`}>
            View
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      ),
    },
  ];
}
