"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { MaterialForm } from "./material-form"
import { RawMaterial } from "@/lib/types"

const ActionsCell = ({ row, table }: { row: any; table: any }) => {
    const material = row.original;
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const providers = table.options.meta?.providers;

    const editableMaterial = {
        ...material,
        cost: material.cost
    }

    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                        onClick={() => navigator.clipboard.writeText(material.id)}
                    >
                        Copy material ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setIsSheetOpen(true)}>
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <SheetContent className="sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>Edit Raw Material</SheetTitle>
                    <SheetDescription>
                        Update the details for your inventory item.
                    </SheetDescription>
                </SheetHeader>
                <MaterialForm initialData={editableMaterial} onClose={() => setIsSheetOpen(false)} providers={providers} />
            </SheetContent>
        </Sheet>
    );
};


export const columns: ColumnDef<RawMaterial>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SKU Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="pl-4">{row.original.name}</div>
  },
  {
    accessorKey: "shortName",
    header: "Short Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "provider",
    header: "Provider",
  },
   {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({row}) => <div>{`${row.original.quantity} ${row.original.unit}`}</div>
  },
  {
    accessorKey: "cost",
    header: () => <div className="text-right">Cost</div>,
    cell: ({ row }) => {
      const cost = parseFloat(row.getValue("cost"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(cost)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: 'costPerUnit',
    header: () => <div className="text-right">Cost per Unit</div>,
    cell: ({ row }) => {
      const { cost, quantity } = row.original;
      if (!quantity || quantity <= 0) {
        return <div className="text-right font-medium">-</div>;
      }
      const costPerUnit = cost / quantity;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(costPerUnit);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ActionsCell,
  },
]
