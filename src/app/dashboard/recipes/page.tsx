'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { calculateRecipeCost } from '@/lib/utils';
import { Edit, LayoutGrid, List, PlusCircle, Search, Trash2 } from 'lucide-react';
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
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import type { Recipe } from '@/lib/types';
import type { RecipeFormValues } from '@/hooks/use-recipes';
import { getList, RECIPE_CATEGORIES_KEY } from '@/lib/lists';

export default function RecipesPage() {
  const { recipes, isLoading, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { materials, isLoading: isLoadingMaterials } = useRawMaterials();
  const { toast } = useToast();
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');

  const handleEdit = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsEditSheetOpen(true);
  };

  const handleUpdateRecipe = (data: RecipeFormValues) => {
    if (!recipeToEdit) return;
    updateRecipe(recipeToEdit.id, data);
    setIsEditSheetOpen(false);
  };

  const handleAddNewRecipe = (data: RecipeFormValues) => {
    addRecipe(data);
    setIsNewSheetOpen(false);
  };

  const handleDelete = async () => {
    if (!recipeToDelete) return;
    
    setIsDeleting(true);
    try {
      const recipeName = recipes.find(r => r.id === recipeToDelete)?.name || 'Recipe';
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

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const q = searchQuery.toLowerCase();
    return recipes.filter(recipe => {
      const cost = calculateRecipeCost(recipe);
      const profitMargin = recipe.pricePerServing && recipe.pricePerServing > 0
        ? ((recipe.pricePerServing - cost.costPerPortion) / recipe.pricePerServing) * 100
        : 0;
      return (
        recipe.name.toLowerCase().includes(q) ||
        recipe.category.toLowerCase().includes(q) ||
        recipe.description?.toLowerCase().includes(q) ||
        cost.costPerPortion.toFixed(2).includes(q) ||
        (recipe.pricePerServing?.toFixed(2) || '').includes(q) ||
        profitMargin.toFixed(1).includes(q)
      );
    });
  }, [recipes, searchQuery]);

  if (isLoading || isLoadingMaterials) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Recipes
                    </h1>
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
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
            <SheetContent className="sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle className="text-[#6B7280]">Edit Recipe</SheetTitle>
                </SheetHeader>
                {recipeToEdit && (
                    <RecipeForm 
                        initialData={recipeToEdit}
                        onSave={handleUpdateRecipe} 
                        rawMaterials={materials}
                        existingCategories={getList(RECIPE_CATEGORIES_KEY)}}
                        onCancel={() => setIsEditSheetOpen(false)}
                    />
                )}
            </SheetContent>
        </Sheet>
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        Recipes
      </h1>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode('card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <Sheet open={isNewSheetOpen} onOpenChange={setIsNewSheetOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    New Recipe
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>Create New Recipe</SheetTitle>
                </SheetHeader>
                <RecipeForm
                    onSave={handleAddNewRecipe}
                    rawMaterials={materials}
                    existingCategories={getList(RECIPE_CATEGORIES_KEY)}}
                    onCancel={() => setIsNewSheetOpen(false)}
                />
            </SheetContent>
        </Sheet>
      </div>

      {viewMode === 'card' ? (
        <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => {
            const cost = calculateRecipeCost(recipe);
            const profitMargin = recipe.pricePerServing && recipe.pricePerServing > 0
              ? ((recipe.pricePerServing - cost.costPerPortion) / recipe.pricePerServing) * 100
              : 0;
            return (
              <Card key={recipe.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline">{recipe.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow">
                  <div className="flex justify-between items-center pt-2 text-sm flex-grow">
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(recipe.pricePerServing ?? 0)}
                      </span>
                      <span className="text-muted-foreground">Price / Portion</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-semibold text-lg">
                        {profitMargin.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">Profit Margin</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-start">
                   <div className="flex-grow w-full"></div>
                  <div className="flex items-center space-x-1 ml-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(recipe)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
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
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-right p-3 font-medium">Cost / Portion</th>
                <th className="text-right p-3 font-medium">Price / Portion</th>
                <th className="text-right p-3 font-medium">Profit Margin</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipes.map((recipe) => {
                const cost = calculateRecipeCost(recipe);
                const profitMargin = recipe.pricePerServing && recipe.pricePerServing > 0
                  ? ((recipe.pricePerServing - cost.costPerPortion) / recipe.pricePerServing) * 100
                  : 0;
                return (
                  <tr key={recipe.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{recipe.name}</td>
                    <td className="p-3 text-muted-foreground">{recipe.category}</td>
                    <td className="p-3 text-right">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cost.costPerPortion)}
                    </td>
                    <td className="p-3 text-right">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(recipe.pricePerServing ?? 0)}
                    </td>
                    <td className="p-3 text-right">{profitMargin.toFixed(1)}%</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(recipe)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
