'use client';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from './data-table';
import { columns } from './columns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MaterialForm } from './material-form';
import { useState } from 'react';

interface MaterialsClientProps {
  data: any[];
  providers: string[];
}

export default function MaterialsClient({ data, providers }: MaterialsClientProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Add Material
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>Add New Raw Material</SheetTitle>
                </SheetHeader>
                <MaterialForm onClose={() => setIsSheetOpen(false)} providers={providers} />
            </SheetContent>
        </Sheet>
      </div>
      <DataTable columns={columns} data={data} />
    </>
  );
}
