"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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

const ActionsCell = ({ row, table }: { row: any; table: any }) => {
    const material = row.original as RawMaterial;
    const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const { toast } = useToast();

    const meta = table.options.meta as {
        providers: string[];
        updateMaterial: (id: string, data: Partial<Omit<RawMaterial, 'id'>>) => void;
        deleteMaterial: (id: string) => void;
    };
    
    const providers = meta?.providers ?? [];

    const handleUpdate = (formData: Omit<RawMaterial, 'id'>) => {
        meta.updateMaterial(material.id, formData);
        toast({
            title: "Material Updated",
            description: `The material "${formData.shortName}" has been saved.`,
        });
        setIsEditSheetOpen(false);
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            meta.deleteMaterial(material.id);
            toast({
                title: "Material Deleted",
                description: `The material "${material.shortName}" has been deleted.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was a problem with your request.',
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    }
    
    return (
        <>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            raw material.
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

            <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                <SheetContent className="sm:max-w-2xl">
                    <SheetHeader>
                        <SheetTitle>Edit Raw Material</SheetTitle>
                    </SheetHeader>
                    <MaterialForm 
                        initialData={material}
                        onSave={handleUpdate} 
                        onClose={() => setIsEditSheetOpen(false)} 
                        providers={providers} 
                    />
                </SheetContent>
            </Sheet>

            <div className="flex items-center justify-end space-x-1">
                <Button variant="ghost" size="icon" onClick={() => setIsEditSheetOpen(true)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
            </div>
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
    header: () => <div className="text-right">Actions</div>,
  },
]
