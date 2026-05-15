"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useState, useRef, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UNITS } from "@/lib/constants"

// Editable cell component
function EditableCell({
    value: initialValue,
    rowId,
    columnId,
    meta,
    type = "text",
    options,
}: {
    value: string | number;
    rowId: string;
    columnId: string;
    meta: any;
    type?: string;
    options?: { value: string; label: string }[];
}) {
    const isEditing = meta?.editingCell?.rowId === rowId && meta?.editingCell?.columnId === columnId;
    const [tempValue, setTempValue] = useState(String(initialValue));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        setTempValue(String(initialValue));
        meta?.setEditingCell({ rowId, columnId });
    };

    const handleSave = () => {
        meta?.setEditingCell(null);
        if (String(tempValue) !== String(initialValue)) {
            meta?.updateMaterial(rowId, { [columnId]: type === "number" ? Number(tempValue) : tempValue });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") meta?.setEditingCell(null);
    };

    if (isEditing && options) {
        return (
            <Select value={tempValue} onValueChange={(val) => {
                setTempValue(val);
                meta?.setEditingCell(null);
                meta?.updateMaterial(rowId, { [columnId]: val });
            }}>
                <SelectTrigger className="h-8 border-primary">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type={type}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="h-8 border-primary"
                step={type === "number" ? "0.01" : undefined}
            />
        );
    }

    return (
        <div
            className="pl-1 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[28px] flex items-center"
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit"
        >
            {initialValue}
        </div>
    );
}

const ActionsCell = ({ row, table }: { row: any; table: any }) => {
    const material = row.original as RawMaterial;
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const meta = table.options.meta as {
        providers: string[];
        updateMaterial: (id: string, data: Partial<Omit<RawMaterial, 'id'>>) => void;
        deleteMaterial: (id: string) => void;
    };
    
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
                        <SheetTitle className="text-[#6B7280]">Edit Raw Material</SheetTitle>
                    </SheetHeader>
                    <MaterialForm 
                        initialData={material}
                        onSave={handleUpdate} 
                        onClose={() => setIsEditSheetOpen(false)} 
                        providers={meta.providers} 
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
      cell: ({ row, table }) => (
        <EditableCell
          value={row.original.shortName}
          rowId={row.original.id}
          columnId="shortName"
          meta={table.options.meta}
        />
      ),
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
      cell: ({ row, table }) => (
        <EditableCell
          value={row.original.provider}
          rowId={row.original.id}
          columnId="provider"
          meta={table.options.meta}
        />
      ),
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
      cell: ({ row, table }) => (
        <EditableCell
          value={row.original.category}
          rowId={row.original.id}
          columnId="category"
          meta={table.options.meta}
        />
      ),
    },
   {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row, table }) => (
      <EditableCell
        value={row.original.quantity}
        rowId={row.original.id}
        columnId="quantity"
        meta={table.options.meta}
        type="number"
      />
    ),
  },
  {
    accessorKey: "cost",
    header: () => <div className="text-right">Cost</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      const isEditing = meta?.editingCell?.rowId === row.original.id && meta?.editingCell?.columnId === "cost";
      const cost = parseFloat(row.getValue("cost"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(cost)

      if (isEditing) {
        return (
          <Input
            type="number"
            defaultValue={cost}
            step="0.01"
            autoFocus
            className="h-8 border-primary text-right"
            onBlur={(e) => {
              meta?.setEditingCell(null);
              const newVal = parseFloat(e.target.value);
              if (!isNaN(newVal) && newVal !== cost) {
                meta?.updateMaterial(row.original.id, { cost: newVal });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") meta?.setEditingCell(null);
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        );
      }

      return (
        <div
          className="text-right font-medium cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
          onDoubleClick={() => meta?.setEditingCell({ rowId: row.original.id, columnId: "cost" })}
          title="Double-click to edit"
        >
          {formatted}
        </div>
      );
    },
  },
  {
    id: 'unitCost',
    header: () => <div className="text-right">Unit Cost</div>,
    cell: ({ row }) => {
      const quantity = row.original.quantity;
      if (!quantity || quantity <= 0) {
        return <div className="text-right text-muted-foreground">N/A</div>;
      }
      const costPerUnit = row.original.cost / quantity;
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
    header: () => <div className="text-right">Actions</div>,
  },
]
