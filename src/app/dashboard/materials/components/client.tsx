'use client';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from './data-table';
import { columns } from './columns';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MaterialForm } from './material-form';

interface MaterialsClientProps {
  data: any[];
}

export default function MaterialsClient({ data }: MaterialsClientProps) {
  return (
    <>
      <div className="flex justify-end">
        <Sheet>
            <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Add Material
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>Add New Raw Material</SheetTitle>
                    <SheetDescription>
                        Fill in the details for your new inventory item.
                    </SheetDescription>
                </SheetHeader>
                <MaterialForm />
            </SheetContent>
        </Sheet>
      </div>
      <DataTable columns={columns} data={data} />
    </>
  );
}
