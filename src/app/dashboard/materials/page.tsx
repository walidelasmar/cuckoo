'use client';

import { useState, useEffect } from 'react';
import MaterialsClient from '@/components/materials/client';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Skeleton } from '@/components/ui/skeleton';
import { getList, MATERIAL_PROVIDERS_KEY, MATERIAL_CATEGORIES_KEY } from '@/lib/lists';

export default function RawMaterialsPage() {
  const { isLoading, currentUser, isViewer } = useAuth();
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useRawMaterials();
  const { t } = useLanguage();
  const orgId = currentUser?.orgId;

  const [providers, setProviders] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (orgId) {
      getList(MATERIAL_PROVIDERS_KEY, orgId).then(setProviders);
      getList(MATERIAL_CATEGORIES_KEY, orgId).then(setCategories);
    }
  }, [orgId]);

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    {t.materials.title}
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
            {t.materials.title}
          </h1>
        </div>
      </div>
      <MaterialsClient
        data={materials}
        providers={providers}
        categories={categories}
        addMaterial={isViewer ? () => {} : addMaterial}
        updateMaterial={isViewer ? () => {} : updateMaterial}
        deleteMaterial={isViewer ? () => {} : deleteMaterial}
        isReadOnly={isViewer}
        t={t.materials}
      />
    </main>
  );
}
