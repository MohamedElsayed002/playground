"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DataTableColumnHeader } from "@/components/users/data-table-column-header";
import { AuditLogDetailsDialog } from "./details-dialog";
import type { AuditLogItem } from "@/types/audit-log";

export const columns: ColumnDef<AuditLogItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <span className="text-muted-foreground whitespace-nowrap">{format(date, "PPP p")}</span>;
    },
  },
  {
    accessorKey: "event",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Event" />,
    cell: ({ row }) => {
      return <span className="font-medium uppercase text-xs tracking-wider">{row.getValue("event")}</span>;
    },
  },
  {
    accessorKey: "user_id",
    header: "User ID",
    cell: ({ row }) => {
      const userId = row.getValue("user_id");
      return userId ? (
        <Badge variant="outline" className="text-white">{String(userId)}</Badge>
      ) : (
        <span className="text-muted-foreground italic">System</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const isSuccess = status.toLowerCase() === "success" || status.toLowerCase() === "completed";
      return (
        <Badge variant={isSuccess ? "default" : "destructive"} className={isSuccess ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20" : ""}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Details",
    cell: ({ row }) => {
      return <AuditLogDetailsDialog log={row.original} />;
    },
  },
];
