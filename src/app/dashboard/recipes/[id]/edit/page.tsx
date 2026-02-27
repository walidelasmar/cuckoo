'use client';

import { useRouter, useParams } from 'next/navigation';
import { useRecipes } from '@/hooks/use-recipes';
import type { RecipeFormValues } from '@/hooks/use-recipes';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { RecipeForm } from '../../components/recipe-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;

  const { recipes, updateRecipe, isLoading: isLoadingRecipes } = useRecipes();
  const { materials, isLoading: isLoadingMaterials } = useRawMaterials();

  const recipeToEdit = recipes.find(r => r.id === recipeId);

  if (isLoadingRecipes || isLoadingMaterials) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Edit Recipe
          </h1>
        </div>
        <Skeleton className="h-96 w-full" />
      </main>
    )
  }

  if (!recipeToEdit) {
     return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
           <div className="flex items-center">
              <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                  Recipe not found
                </h1>
              </div>
            </div>
        </main>
      );
  }

  const handleSave = (data: RecipeFormValues) => {
    if (!recipeId) return;
    updateRecipe(recipeId, data);
    router.push('/dashboard/recipes');
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div className="flex items-center">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Edit Recipe
            </h1>
          </div>
        </div>
      <RecipeForm 
        initialData={recipeToEdit}
        onSave={handleSave} 
        rawMaterials={materials}
        onCancel={() => router.push('/dashboard/recipes')}
      />
    </main>
  );
}
