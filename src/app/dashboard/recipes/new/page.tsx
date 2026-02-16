'use client';

import { useRouter } from 'next/navigation';
import { useRecipes } from '@/hooks/use-recipes';
import type { RecipeFormValues } from '@/hooks/use-recipes';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { RecipeForm } from '../components/recipe-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewRecipePage() {
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const { materials, isLoading: isLoadingMaterials } = useRawMaterials();

  if (isLoadingMaterials) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Create New Recipe
          </h1>
        </div>
        <Skeleton className="h-96 w-full" />
      </main>
    )
  }

  const handleSave = (data: RecipeFormValues) => {
    addRecipe(data);
    router.push('/dashboard/recipes');
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div className="flex items-center">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Create New Recipe
            </h1>
          </div>
        </div>
      <RecipeForm 
        onSave={handleSave} 
        rawMaterials={materials}
        onCancel={() => router.push('/dashboard/recipes')}
      />
    </main>
  );
}
