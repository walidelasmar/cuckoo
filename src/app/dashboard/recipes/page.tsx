'use client';

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
import { calculateRecipeCost } from '@/lib/utils';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { useRecipes } from '@/hooks/use-recipes';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function RecipesPage() {
  const { recipes, isLoading, deleteRecipe } = useRecipes();
  const [isDeleting, setIsDeleting] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!recipeToDelete) return;
    
    setIsDeleting(true);
    try {
        const recipeName = recipes.find(r => r.id === recipeToDelete)?.name;
        deleteRecipe(recipeToDelete);
        toast({
            title: "Recipe Deleted",
            description: `The recipe "${recipeName}" has been deleted.`,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
        });
    } finally {
        setIsDeleting(false);
        setRecipeToDelete(null);
    }
  }

  if (isLoading) {
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
                <Skeleton className="h-9 w-32" />
            </div>
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-72 w-full" />)}
            </div>
        </main>
    );
  }


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <AlertDialog open={!!recipeToDelete} onOpenChange={(open) => !open && setRecipeToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this
                        recipe.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={() => setRecipeToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground focus-visible:ring-destructive"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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
            <Card key={recipe.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">{recipe.name}</CardTitle>
                <CardDescription>{recipe.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">
                  {recipe.description}
                </p>
                <div className="flex justify-between items-center pt-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(cost.totalCost)}
                    </span>
                    <span className="text-muted-foreground">Total Cost</span>
                  </div>
                  <div className="flex items-center gap-2">
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
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex items-center space-x-1 ml-auto">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/dashboard/recipes/${recipe.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setRecipeToDelete(recipe.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
