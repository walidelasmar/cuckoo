import { rawMaterials } from '@/lib/data';
import MaterialsClient from './components/client';

export default function RawMaterialsPage() {
  const formattedMaterials = rawMaterials.map((item) => ({
    ...item,
  }));

  const providers = Array.from(
    new Set(rawMaterials.map((m) => m.provider).filter((p): p is string => !!p))
  ).sort();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Raw Materials
          </h1>
          <p className="text-muted-foreground">
            Manage your inventory of raw materials.
          </p>
        </div>
      </div>
      <MaterialsClient data={formattedMaterials} providers={providers} />
    </main>
  );
}
