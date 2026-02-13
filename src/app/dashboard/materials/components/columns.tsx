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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { MaterialForm } from "./material-form"
import { RawMaterial } from "@/lib/types"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteMaterial } from "../actions"

const ActionsCell = ({ row, table }: { row: any; table: any }) => {
    const material = row.original as RawMaterial;
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const providers = table.options.meta?.providers;
    const { toast } = useToast();

    const editableMaterial = {
        ...material,
        cost: material.cost
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteMaterial(material.id);
            if (result.success) {
                toast({
                    title: "Material Deleted",
                    description: `The material "${material.shortName}" has been deleted.`,
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was a problem with your request.',
            });
        } finally {
            setIsDeleting(false);
            setIsAlertOpen(false);
        }
    }
    
    return (
        <>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            raw material and remove it from any recipes where it is used.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground focus-visible:ring-destructive"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-2xl">
                    <SheetHeader>
                        <SheetTitle>Edit Raw Material</SheetTitle>
                    </SheetHeader>
                    <MaterialForm initialData={editableMaterial} onClose={() => setIsSheetOpen(false)} providers={providers} />
                </SheetContent>
            </Sheet>

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
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onSelect={() => setIsAlertOpen(true)}
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};


export const columns: ColumnDef<RawMaterial>[] = [
    {
      accessorKey: "shortName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Short Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="pl-4">{row.original.shortName}</div>
    },
    {
      accessorKey: "provider",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Provider
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
      cell: ({ row }) => <div className="pl-4">{row.getValue("provider")}</div>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Category
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
      cell: ({ row }) => <div className="pl-4">{row.getValue("category")}</div>,
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
      const costValue = row.getValue("cost");
      const cost = typeof costValue === 'string' ? parseFloat(costValue) : (costValue as number ?? 0);
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
    id: 'unitCost',
    header: () => <div className="text-right">Unit Cost</div>,
    cell: ({ row }) => {
      const { cost, quantity, unit } = row.original;
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
      return <div className="text-right font-medium">{`${formatted}/${unit}`}</div>;
    },
  },
  {
    id: "actions",
    cell: ActionsCell,
  },
]
