"use client"

import { User } from "@/types"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "./data-table-column-header"
import { Checkbox } from "@/components/ui/checkbox"

import { sileo } from "sileo"

import { Link } from "@/components/nextjs-docs/transition-progress-layout"

export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const image = row.getValue("image") as string
      return (
        <img
          src={image || "/fallback.png"}
          alt="user"
          className="w-10 h-10 rounded-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/fallback.jpg"
          }}
        />
      )
    }
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <>
          {/* <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name 
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button> */}
          <DataTableColumnHeader column={column} title='Name' />
        </>
      )
    }
  },
  {
    accessorKey: "bio",
    header: "Bio"
  },
  {
    accessorKey: "sex",
    header: "Gender"
  },
  {
    id: "actions",
    cell: ({ row, cell }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(row.original.id)
                sileo.success({
                  title: 'User ID copied successfully'
                })
              }}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/users/${row.original.id}`}>View User</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onClick={() => {
                // @ts-ignore
                (table.options.meta as { onRequestDeleteUser?: (id: string, label?: string) => void })?.onRequestDeleteUser?.(
                  row.original.id,
                  row.original.name
                )
              }}
            >
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]