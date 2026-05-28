'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Recipe, RawMaterial, Ingredient } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { syncRecipeLists } from '@/lib/lists';
import { useAuth } from '@/hooks/use-auth';

const ORG_ROW_ID = (orgId: string) => `rec-${orgId}`;
const MAT_ROW_ID = (orgId: string) => `rm-${orgId}`;

type StorableIngredient = Omit<Ingredient, 'rawMaterial' | 'id'> & { id?: string; rawMaterialId: string };
type StorableRecipe = Omit<Recipe, 'ingredients'> & { ingredients: StorableIngredient[] };

export type RecipeFormValues = Omit<Recipe, 'id' | 'ingredients'> & {
  ingredients: (Omit<Ingredient, 'rawMaterial'> & { rawMaterialId: string })[];
};

export function useRecipes() {
  const { currentUser } = useAuth();
  const orgId = currentUser?.orgId || '';

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMaterials = useCallback(async (): Promise<RawMaterial[]> => {
    if (!orgId) return [];
    const { data } = await supabase.from('raw_materials').select('data').eq('id', MAT_ROW_ID(orgId)).maybeSingle();
    return (data?.data as RawMaterial[]) || [];
  }, [orgId]);

  const hydrate = useCallback((storableRecipes: StorableRecipe[], materials: RawMaterial[]): Recipe[] => {
    const byId = new Map(materials.map(m => [m.id, m]));
    return storableRecipes.map(r => ({
      ...r,
      ingredients: r.ingredients.map(ing => ({
        ...ing,
        id: ing.id || `ing-${Math.random()}`,
        rawMaterial: byId.get(ing.rawMaterialId) as RawMaterial,
      })),
    }));
  }, []);

  const loadRecipes = useCallback(async () => {
    if (!orgId) { setRecipes([]); setIsLoading(false); return; }
    setIsLoading(true);
    const [recRow, materials] = await Promise.all([
      supabase.from('recipes').select('data').eq('id', ORG_ROW_ID(orgId)).maybeSingle(),
      getMaterials(),
    ]);
    const storableRecipes: StorableRecipe[] = (recRow.data?.data as StorableRecipe[]) || [];
    setRecipes(hydrate(storableRecipes, materials));
    setIsLoading(false);
  }, [orgId, getMaterials, hydrate]);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  const saveRecipes = useCallback(async (updated: Recipe[]) => {
    if (!orgId) return;
    const storable: StorableRecipe[] = updated.map(r => ({
      ...r,
      ingredients: r.ingredients.map(ing => ({ id: ing.id, quantity: ing.quantity, unit: ing.unit, rawMaterialId: ing.rawMaterial?.id || '' })),
    }));
    await supabase.from('recipes').upsert({ id: ORG_ROW_ID(orgId), org_id: orgId, data: storable, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    setRecipes(updated);
    await syncRecipeLists(updated, orgId);
  }, [orgId]);

  const addRecipe = useCallback(async (values: RecipeFormValues) => {
    const materials = await getMaterials();
    const byId = new Map(materials.map(m => [m.id, m]));
    const newRecipe: Recipe = {
      ...values,
      id: `recipe-${Date.now()}`,
      ingredients: values.ingredients.map(ing => ({ ...ing, id: ing.id || `ing-${Math.random()}`, rawMaterial: byId.get(ing.rawMaterialId) as RawMaterial })),
    };
    await saveRecipes([...recipes, newRecipe]);
  }, [recipes, saveRecipes, getMaterials]);

  const updateRecipe = useCallback(async (id: string, values: RecipeFormValues) => {
    const materials = await getMaterials();
    const byId = new Map(materials.map(m => [m.id, m]));
    const updated = recipes.map(r => r.id === id ? {
      ...r, ...values,
      ingredients: values.ingredients.map(ing => ({ ...ing, id: ing.id || `ing-${Math.random()}`, rawMaterial: byId.get(ing.rawMaterialId) as RawMaterial })),
    } : r);
    await saveRecipes(updated);
  }, [recipes, saveRecipes, getMaterials]);

  const deleteRecipe = useCallback(async (id: string) => {
    await saveRecipes(recipes.filter(r => r.id !== id));
  }, [recipes, saveRecipes]);

  return { recipes, isLoading, addRecipe, updateRecipe, deleteRecipe };
}
