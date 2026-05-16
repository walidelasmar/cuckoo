'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Recipe, RawMaterial, Ingredient } from '@/lib/types';
import { recipes as initialRecipes, rawMaterials as initialRawMaterials } from '@/lib/data';
import { syncRecipeLists } from '@/lib/lists';

const RECIPES_STORAGE_KEY = 'recipes';
const MATERIALS_STORAGE_KEY = 'rawMaterials';

type StorableIngredient = Omit<Ingredient, 'rawMaterial' | 'id'> & { id?: string, rawMaterialId: string };
type StorableRecipe = Omit<Recipe, 'ingredients'> & {
  ingredients: StorableIngredient[];
}
export type RecipeFormValues = Omit<Recipe, 'id' | 'ingredients'> & {
  ingredients: (Omit<Ingredient, 'rawMaterial'> & { rawMaterialId: string })[]
};

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMaterials = useCallback((): RawMaterial[] => {
    try {
      const storedMaterialsJSON = localStorage.getItem(MATERIALS_STORAGE_KEY);
      return storedMaterialsJSON ? JSON.parse(storedMaterialsJSON) : initialRawMaterials;
    } catch {
      return initialRawMaterials;
    }
  }, []);

  useEffect(() => {
    try {
      const storedRecipesJSON = localStorage.getItem(RECIPES_STORAGE_KEY);
      const materials = getMaterials();
      const materialsById = new Map(materials.map(m => [m.id, m]));

      let storableRecipes: StorableRecipe[];

      if (storedRecipesJSON) {
        storableRecipes = JSON.parse(storedRecipesJSON);
      } else {
        storableRecipes = initialRecipes.map(recipe => ({
            ...recipe,
            ingredients: recipe.ingredients.map(ing => ({
                id: ing.id,
                quantity: ing.quantity,
                unit: ing.unit,
                rawMaterialId: ing.rawMaterial.id,
            }))
        }));
        localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(storableRecipes));
      }

      const hydratedRecipes: Recipe[] = storableRecipes.map(storableRecipe => ({
        ...storableRecipe,
        ingredients: storableRecipe.ingredients.map(storableIngredient => ({
            ...storableIngredient,
            id: storableIngredient.id || `ing-${Math.random()}`,
            rawMaterial: materialsById.get(storableIngredient.rawMaterialId)!
        })).filter(i => i.rawMaterial) 
      }));
      
      setRecipes(hydratedRecipes);
      syncRecipeLists(hydratedRecipes);

    } catch (error) {
      console.error("Failed to access localStorage for recipes", error);
      setRecipes(initialRecipes);
      syncRecipeLists(initialRecipes);
    } finally {
        setIsLoading(false);
    }
  }, [getMaterials]);

  const updateLocalStorage = (updatedRecipes: Recipe[]) => {
    const storableRecipes: StorableRecipe[] = updatedRecipes.map(recipe => ({
        ...recipe,
        ingredients: recipe.ingredients.map(ing => ({
            id: ing.id,
            quantity: ing.quantity,
            unit: ing.unit,
            rawMaterialId: ing.rawMaterial.id,
        }))
    }));
    localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(storableRecipes));
  };
  
  const addRecipe = (newRecipeData: RecipeFormValues) => {
    const materials = getMaterials();
    const materialsById = new Map(materials.map(m => [m.id, m]));

    const newRecipe: Recipe = {
      ...newRecipeData,
      id: `rec-${Date.now()}`,
      ingredients: newRecipeData.ingredients.map((ing, index) => ({
        ...ing,
        id: `ing-${Date.now()}-${index}`,
        rawMaterial: materialsById.get(ing.rawMaterialId)!,
      })),
    };
    const updatedRecipes = [newRecipe, ...recipes];
    setRecipes(updatedRecipes);
    updateLocalStorage(updatedRecipes);
    syncRecipeLists(updatedRecipes);
    return newRecipe;
  };

  const updateRecipe = (id: string, updatedRecipeData: RecipeFormValues) => {
    const materials = getMaterials();
    const materialsById = new Map(materials.map(m => [m.id, m]));

    const updatedRecipes = recipes.map(recipe => {
      if (recipe.id === id) {
        return {
          ...recipe,
          ...updatedRecipeData,
          ingredients: updatedRecipeData.ingredients.map(ing => ({
            id: ing.id || `ing-${Date.now()}-${Math.random()}`, // create id for new ingredients
            quantity: ing.quantity,
            unit: ing.unit,
            rawMaterial: materialsById.get(ing.rawMaterialId)!,
          })),
        };
      }
      return recipe;
    });
    setRecipes(updatedRecipes);
    updateLocalStorage(updatedRecipes);
    syncRecipeLists(updatedRecipes);
  };

  const deleteRecipe = (id: string) => {
    const updatedRecipes = recipes.filter((recipe) => recipe.id !== id);
    setRecipes(updatedRecipes);
    updateLocalStorage(updatedRecipes);
    syncRecipeLists(updatedRecipes);
  };
  
  return { recipes, isLoading, addRecipe, updateRecipe, deleteRecipe };
}
