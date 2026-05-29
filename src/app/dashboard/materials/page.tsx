'use client';

import { useState, useEffect } from 'react';
import MaterialsClient from '@/components/materials/client';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Skeleton } from '@/components/ui/skeleton';
import { getList, MATERIAL_PROVIDERS_KEY, MATERIAL_CATEGORIES_KEY } from '@/lib/lists';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '\u20ac', GBP: '\u00a3', JPY: '\u00a5', CAD: 'CA$',
  AUD: 'A$', CHF: 'CHF', CNY: '\u00a5', MXN: 'MX$', BRL: 'R$',
  AED: 'AED', SAR: 'SAR', MAD: 'MAD', EGP: 'EGP',
};

export default function RawMaterialsPage() {
  const { isLoading: authLoading, currentUser, isViewer, currency } = useAuth();
  const { materials, isLoading, addMaterial, addMaterials, updateMaterial, deleteMaterial, deleteAllMaterials } = useRawMaterials();
  const { t } = useLanguage();
  const orgId = currentUser?.orgId;

  const [providers, setProviders] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!orgId) return;
    getList(MATERIAL_PROVIDERS_KEY, orgId).then(setProviders);
    getList(MATERIAL_CATEGORIES_KEY, orgId).then(setCategories);
  }, [orgId]);

  if (isLoading || authLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  const noop = (_m: any) => {};
  const noopId = (_id: string, _u?: any) => {};
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency || '$';

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
        addMaterial={isViewer ? noop : addMaterial}
        addMaterials={isViewer ? undefined : addMaterials}
        updateMaterial={isViewer ? noopId : updateMaterial}
        deleteMaterial={isViewer ? noopId : deleteMaterial}
        deleteAllMaterials={isViewer ? undefined : deleteAllMaterials}
        isReadOnly={isViewer}
        currency={currencySymbol}
        t={t.materials}
      />
    </main>
  );
}
