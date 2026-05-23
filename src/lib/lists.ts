import type { RawMaterial } from '@/lib/types';
import type { Recipe } from '@/lib/types';

// Base keys — always suffixed with _orgId when an org is known
export const RECIPE_CATEGORIES_KEY = 'recipeCategories';
export const MATERIAL_CATEGORIES_KEY = 'materialCategories';
export const MATERIAL_PROVIDERS_KEY = 'materialProviders';

/** Returns the org-scoped storage key, or the bare key for fallback/SSR. */
export function listKey(base: string, orgId?: string): string {
  return orgId ? `${base}_${orgId}` : base;
}

/**
 * Reads a sorted, deduplicated string list from localStorage.
 * Pass orgId to read from the org-scoped key.
 */
export function getList(key: string, orgId?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const scopedKey = orgId ? `${key}_${orgId}` : key;
    const raw = localStorage.getItem(scopedKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Writes a sorted, deduplicated string list to localStorage.
 */
function saveList(key: string, values: string[], orgId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const scopedKey = orgId ? `${key}_${orgId}` : key;
    const sorted = Array.from(new Set(values.filter(Boolean))).sort();
    localStorage.setItem(scopedKey, JSON.stringify(sorted));
  } catch {
    // ignore
  }
}

/**
 * Re-derives and saves materialCategories + materialProviders
 * from the current full list of raw materials.
 * Call this whenever materials are added, updated, or deleted.
 */
export function syncMaterialLists(materials: RawMaterial[], orgId?: string): void {
  saveList(MATERIAL_CATEGORIES_KEY, materials.map(m => m.category).filter(Boolean), orgId);
  saveList(MATERIAL_PROVIDERS_KEY, materials.map(m => m.provider).filter(Boolean), orgId);
}

/**
 * Re-derives and saves recipeCategories from the current full list of recipes.
 * Call this whenever recipes are added, updated, or deleted.
 */
export function syncRecipeLists(recipes: Pick<Recipe, 'category'>[], orgId?: string): void {
  saveList(RECIPE_CATEGORIES_KEY, recipes.map(r => r.category).filter(Boolean), orgId);
}
