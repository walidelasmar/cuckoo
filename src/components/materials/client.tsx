'use client';
import { PlusCircle, Search, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from './data-table';
import { columns } from './columns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MaterialForm } from './material-form';
import { useRef, useState } from 'react';
import type { RawMaterial, Unit } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MaterialsClientProps {
  data: RawMaterial[];
  providers: string[];
  categories: string[];
  isReadOnly?: boolean;
  t?: { addMaterial: string; search: string; uploadCSV: string };
  addMaterial: (data: Omit<RawMaterial, 'id'>) => void;
  addMaterials?: (batch: Omit<RawMaterial, 'id'>[]) => void;
  updateMaterial: (id: string, data: Partial<Omit<RawMaterial, 'id'>>) => void;
  deleteMaterial: (id: string) => void;
  deleteAllMaterials?: () => void;
  currency?: string;
}

const VALID_UNITS: Unit[] = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pc', 'portion'];

function parseCSV(text: string): Omit<RawMaterial, 'id'>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

  const colIdx = (names: string[]) => {
    for (const name of names) {
      const i = headers.findIndex(h => h === name || h.includes(name));
      if (i !== -1) return i;
    }
    return -1;
  };

  const nameIdx = colIdx(['name']);
  const shortnameIdx = colIdx(['shortname', 'short']);
  const categoryIdx = colIdx(['category', 'cat']);
  const providerIdx = colIdx(['provider', 'supplier', 'vendor']);
  const skuIdx = colIdx(['sku', 'code', 'ref']);
  const quantityIdx = colIdx(['quantity', 'qty', 'amount']);
  const unitIdx = colIdx(['unit', 'uom']);
  const costIdx = colIdx(['cost', 'price', 'unitcost', 'unitprice']);
  const allergensIdx = colIdx(['allergens', 'allergen', 'allergy']);

  const results: Omit<RawMaterial, 'id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const name = nameIdx >= 0 ? cols[nameIdx] : '';
    if (!name) continue;

    const rawUnit = unitIdx >= 0 ? cols[unitIdx]?.toLowerCase() : '';
    const unit: Unit = VALID_UNITS.includes(rawUnit as Unit) ? (rawUnit as Unit) : 'g';

    const quantity = quantityIdx >= 0 ? parseFloat(cols[quantityIdx]) || 1 : 1;
    const cost = costIdx >= 0 ? parseFloat(cols[costIdx]) || 0 : 0;
    const allergens = allergensIdx >= 0 && cols[allergensIdx]
      ? cols[allergensIdx].split(';').map(a => a.trim()).filter(Boolean)
      : undefined;

    results.push({
      name,
      shortName: shortnameIdx >= 0 && cols[shortnameIdx] ? cols[shortnameIdx] : name.slice(0, 20),
      category: categoryIdx >= 0 && cols[categoryIdx] ? cols[categoryIdx] : '',
      provider: providerIdx >= 0 && cols[providerIdx] ? cols[providerIdx] : '',
      sku: skuIdx >= 0 && cols[skuIdx] ? cols[skuIdx] : '',
      quantity,
      unit,
      cost,
      ...(allergens ? { allergens } : {}),
    });
  }

  return results;
}

export default function MaterialsClient({
  data,
  providers,
  categories,
  addMaterial,
  addMaterials,
  updateMaterial,
  deleteMaterial,
  deleteAllMaterials,
  currency = '$',
  isReadOnly = false,
  t,
}: MaterialsClientProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const csvInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAdd = (formData: Omit<RawMaterial, 'id'>) => {
    addMaterial(formData);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast({
          variant: 'destructive',
          title: 'CSV Error',
          description: 'No valid rows found. Make sure the file has a header row with at least a "name" column.',
        });
      } else {
        if (addMaterials) {
          addMaterials(parsed);
        } else {
          parsed.forEach(m => addMaterial(m));
        }
        toast({
          title: 'CSV Imported',
          description: `${parsed.length} material${parsed.length > 1 ? 's' : ''} added successfully.`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteAll = () => {
    if (deleteAllMaterials) {
      deleteAllMaterials();
      toast({
        title: 'All materials deleted',
        description: 'Your materials list has been cleared.',
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 py-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t?.search ?? 'Search all fields...'}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        {!isReadOnly && (
          <>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => csvInputRef.current?.click()}
              title="Upload materials from CSV"
            >
              <Upload className="h-4 w-4" />
              {t?.uploadCSV ?? 'Upload CSV'}
            </Button>
            {deleteAllMaterials && data.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="gap-1">
                    <Trash2 className="h-4 w-4" />
                    Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all materials?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {data.length} material{data.length !== 1 ? 's' : ''} from your list. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDeleteAll}
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  {t?.addMaterial ?? 'Add Material'}
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-2xl">
                <SheetHeader>
                  <SheetTitle>{t?.addMaterial ?? 'Add New Raw Material'}</SheetTitle>
                </SheetHeader>
                <MaterialForm
                  onSave={handleAdd}
                  onClose={() => setIsSheetOpen(false)}
                  providers={providers}
                  categories={categories}
                />
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
      <DataTable
        columns={columns}
        data={data}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        meta={{
          providers,
          categories,
          updateMaterial,
          deleteMaterial,
          currency,
        }}
      />
    </>
  );
}
