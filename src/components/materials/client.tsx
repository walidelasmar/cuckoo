'use client';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from './data-table';
import { columns } from './columns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MaterialForm } from './material-form';
import { useState } from 'react';
import type { RawMaterial } from '@/lib/types';

interface MaterialsClientProps {
  data: RawMaterial[];
  providers: string[];
  categories: string[];
  addMaterial: (data: Omit<RawMaterial, 'id'>) => void;
  updateMaterial: (id: string, data: Partial<Omit<RawMaterial, 'id'>>) => void;
  deleteMaterial: (id: string) => void;
}

export default function MaterialsClient({ data, providers, categories, addMaterial, updateMaterial, deleteMaterial }: MaterialsClientProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const handleAdd = (formData: Omit<RawMaterial, 'id'>) => {
    addMaterial(formData);
  };

  return (
    <>
      <div className="flex items-center gap-3 py-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all fields..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
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
                <MaterialForm 
                    onSave={handleAdd} 
                    onClose={() => setIsSheetOpen(false)} 
                    providers={providers} 
          categories={categories}
                />
            </SheetContent>
        </Sheet>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        globalFilter={globalFilter}
        meta={{
            providers,
            categories,
            updateMaterial,
            deleteMaterial,
        }}
      />
    </>
  );
}
