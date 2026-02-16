import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { recipes } from '@/lib/data';
import { calculateRecipeCost } from '@/lib/utils';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';

export default function RecipesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Recipes
          </h1>
          <p className="text-muted-foreground">
            Create, manage, and calculate costs for your menu items.
          </p>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href="/dashboard/recipes/new">
            <PlusCircle className="h-4 w-4" />
            New Recipe
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => {
          const cost = calculateRecipeCost(recipe);
          return (
            <Card key={recipe.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="font-headline">{recipe.name}</CardTitle>
                  <CardDescription>{recipe.category}</CardDescription>
                </div>
                <div className="flex items-center space-x-1 -mr-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {recipe.description}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(cost.totalCost)}
                  </span>
                  <span className="text-muted-foreground">Total Cost</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-semibold">
                     {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(cost.costPerPortion)}
                  </span>
                  <span className="text-muted-foreground">
                    Cost / Portion ({recipe.portions})
                  </span>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
