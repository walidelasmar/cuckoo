import type { RawMaterial } from '@/lib/types';
import type { Recipe } from '@/lib/types';

export const RECIPE_CATEGORIES_KEY = 'recipeCategories';
export const MATERIAL_CATEGORIES_KEY = 'materialCategories';
export const MATERIAL_PROVIDERS_KEY = 'materialProviders';

/**
 * Reads a sorted, deduplicated string list from localStorage.
 */
export function getList(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Writes a sorted, deduplicated string list to localStorage.
 */
function saveList(key: string, values: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sorted = Array.from(new Set(values.filter(Boolean))).sort();
    localStorage.setItem(key, JSON.stringify(sorted));
  } catch {
    // ignore
  }
}

/**
 * Re-derives and saves materialCategories + materialProviders
 * from the current full list of raw materials.
 * Call this whenever materials are added, updated, or deleted.
 */
export function syncMaterialLists(materials: RawMaterial[]): void {
  saveList(MATERIAL_CATEGORIES_KEY, materials.map(m => m.category).filter(Boolean));
  saveList(MATERIAL_PROVIDERS_KEY, materials.map(m => m.provider).filter(Boolean));
}

/**
 * Re-derives and saves recipeCategories from the current full list of recipes.
 * Call this whenever recipes are added, updated, or deleted.
 */
export function syncRecipeLists(recipes: Pick<Recipe, 'category'>[]): void {
  saveList(RECIPE_CATEGORIES_KEY, recipes.map(r => r.category).filter(Boolean));
}
