"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpRight, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/users/data-table-column-header";
import { StatusBadge } from "../shared/status-badge";
import type { ReportJob } from "@/types/extract-csv-pipeline";

export const reportJobColumns: ColumnDef<ReportJob>[] = [
  {
    accessorKey: "original_filename",
    header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("original_filename")}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={String(row.getValue("status"))} />,
  },
  {
    accessorKey: "ingestion_status",
    header: "Ingestion",
    cell: ({ row }) => <StatusBadge status={String(row.getValue("ingestion_status"))} />,
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => <span>{row.getValue("progress")}%</span>,
  },
  {
    accessorKey: "total_rows",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Rows" />,
  },
  {
    accessorKey: "ingested_rows",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ingested" />,
  },
  {
    accessorKey: "invalid_rows",
    header: "Invalid",
    cell: ({ row }) => {
      const invalidRows = row.getValue("invalid_rows") as number;
      return <span className={invalidRows > 0 ? "font-medium text-red-600" : ""}>{invalidRows}</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <span className="whitespace-nowrap text-muted-foreground">{format(date, "PP p")}</span>;
    },
  },
  {
    id: "actions",
    header: "Products",
    cell: ({ row }) => (
      <Button asChild variant="outline" size="sm">
        <Link href={`/extract-csv-pipeline/normalized-products/${row.original.id}`}>
          View
          <ArrowUpRight className="size-4" />
        </Link>
      </Button>
    ),
  },
];
