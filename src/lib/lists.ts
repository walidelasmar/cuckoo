import type { RawMaterial } from '@/lib/types';
import type { Recipe } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export const RECIPE_CATEGORIES_KEY = 'recipeCategories';
export const MATERIAL_CATEGORIES_KEY = 'materialCategories';
export const MATERIAL_PROVIDERS_KEY = 'materialProviders';

export async function getList(key: string, orgId?: string): Promise<string[]> {
  if (!orgId) return [];
  const { data } = await supabase.from('org_lists').select('items').eq('org_id', orgId).eq('list_key', key).maybeSingle();
  return (data?.items as string[]) || [];
}

export async function saveList(key: string, values: string[], orgId?: string): Promise<void> {
  if (!orgId) return;
  await supabase.from('org_lists').upsert({ org_id: orgId, list_key: key, items: values, updated_at: new Date().toISOString() }, { onConflict: 'org_id,list_key' });
}

export async function syncMaterialLists(materials: RawMaterial[], orgId?: string): Promise<void> {
  if (!orgId) return;
  const categories = [...new Set(materials.map(m => m.category).filter(Boolean))];
  const providers = [...new Set(materials.map(m => m.provider).filter(Boolean))];
  await Promise.all([
    saveList(MATERIAL_CATEGORIES_KEY, categories, orgId),
    saveList(MATERIAL_PROVIDERS_KEY, providers, orgId),
  ]);
}

export async function syncRecipeLists(recipes: Recipe[], orgId?: string): Promise<void> {
  if (!orgId) return;
  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))];
  await saveList(RECIPE_CATEGORIES_KEY, categories, orgId);
}
