'use client';

import MaterialsClient from '@/components/materials/client';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { Skeleton } from '@/components/ui/skeleton';

export default function RawMaterialsPage() {
  const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial } = useRawMaterials();

  const providers = Array.from(
    new Set(materials.map((m) => m.provider).filter((p): p is string => !!p))
  ).sort();

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Raw Materials
                </h1>
                </div>
            </div>
            <div className="space-y-4">
                <div className='flex justify-end'>
                    <Skeleton className="h-9 w-32" />
                </div>
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-64 w-full" />
                <div className="flex justify-end space-x-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
        </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Raw Materials
          </h1>
        </div>
      </div>
      <MaterialsClient 
        data={materials} 
        providers={providers}
        addMaterial={addMaterial}
        updateMaterial={updateMaterial}
        deleteMaterial={deleteMaterial}
      />
    </main>
  );
}
