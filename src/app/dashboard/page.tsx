'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CookingPot, Carrot, DollarSign } from 'lucide-react';
import { useRecipes } from '@/hooks/use-recipes';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { calculateRecipeCost } from '@/lib/utils';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { recipes, recipesById } = useRecipes();
  const { materials, materialsById } = useRawMaterials();
  const { t } = useLanguage();

  const userName = currentUser?.fullName?.split(' ')[0] || 'User';

  const highestCostRecipe = useMemo(() => {
    if (!recipes.length) return null;
    return recipes.reduce((best, recipe) => {
      const cost = calculateRecipeCost(recipe, materialsById, recipesById);
      const bestCost = calculateRecipeCost(best, materialsById, recipesById);
      return cost.costPerPortion > bestCost.costPerPortion ? recipe : best;
    }, recipes[0]);
  }, [recipes, materialsById, recipesById]);

  const highestCost = highestCostRecipe
    ? calculateRecipeCost(highestCostRecipe, materialsById, recipesById).costPerPortion
    : 0;

  const currency = 'USD';

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          {t.dashboard.welcome}, {userName}!
        </h1>
        <p className="text-muted-foreground">
          {t.dashboard.overview}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.totalRecipes}</CardTitle>
            <CookingPot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipes.length}</div>
            <p className="text-xs text-muted-foreground">
              {t.dashboard.totalRecipesDesc}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.rawMaterials}
            </CardTitle>
            <Carrot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
            <p className="text-xs text-muted-foreground">
              {t.dashboard.rawMaterialsDesc}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.highestCostRecipe}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {highestCostRecipe
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(highestCost)
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {highestCostRecipe ? `${highestCostRecipe.name} ${t.dashboard.highestCostRecipeDesc}` : t.dashboard.noRecipesYet}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.gettingStarted}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              {t.dashboard.gettingStartedDesc}
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                {t.dashboard.step1}
              </li>
              <li>
                {t.dashboard.step2}
              </li>
              <li>
                {t.dashboard.step3}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
