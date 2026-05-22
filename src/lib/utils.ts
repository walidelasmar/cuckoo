import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Recipe, RawMaterial } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


const CONVERSIONS_TO_BASE: { [key in import('./types').Unit]?: { base: 'g' | 'ml'; value: number } } = {
  g: { base: 'g', value: 1 },
  kg: { base: 'g', value: 1000 },
  oz: { base: 'g', value: 28.35 },
  lb: { base: 'g', value: 453.592 },
  ml: { base: 'ml', value: 1 },
  l: { base: 'ml', value: 1000 },
  tsp: { base: 'ml', value: 4.929 },
  tbsp: { base: 'ml', value: 14.787 },
  cup: { base: 'ml', value: 236.588 },
};


export function calculateRecipeCost(
  recipe: Recipe,
  materialsById?: Map<string, RawMaterial>,
  recipesById?: Map<string, Recipe>
) {
  let totalCost = 0;

  for (const ingredient of recipe.ingredients) {
    // Recipe-as-ingredient: cost = costPerPortion of the sub-recipe * quantity of portions used
    if (ingredient.unit === 'portion') {
      if (recipesById) {
        const subRecipe = recipesById.get(ingredient.rawMaterial?.id ?? '');
        if (subRecipe) {
          const subCost = calculateRecipeCost(subRecipe, materialsById, recipesById);
          totalCost += ingredient.quantity * subCost.costPerPortion;
          continue;
        }
      }
      // Fallback: use stored cost field (may be 0 if not computed)
      const fallbackCost = ingredient.rawMaterial?.cost ?? 0;
      totalCost += ingredient.quantity * fallbackCost;
      continue;
    }

    const rawMaterial = (materialsById ? materialsById.get(ingredient.rawMaterial?.id ?? '') : null) ?? ingredient.rawMaterial;

    if (!rawMaterial) continue;

    // Direct piece-to-piece calculation
    if (ingredient.unit === 'pc' && rawMaterial.unit === 'pc') {
      totalCost += (ingredient.quantity / rawMaterial.quantity) * rawMaterial.cost;
      continue;
    }

    const ingredientConversion = CONVERSIONS_TO_BASE[ingredient.unit];
    const materialConversion = CONVERSIONS_TO_BASE[rawMaterial.unit];

    // Check for compatibility (both weight or both volume)
    if (ingredientConversion && materialConversion && ingredientConversion.base === materialConversion.base) {
      const ingredientInBase = ingredient.quantity * ingredientConversion.value;
      const materialInBase = rawMaterial.quantity * materialConversion.value;

      if (materialInBase > 0) {
        totalCost += (ingredientInBase / materialInBase) * rawMaterial.cost;
      }
    } else {
      console.warn(`Incompatible units for ingredient ${rawMaterial.name}: ${ingredient.unit} vs ${rawMaterial.unit}`);
    }
  }

  const costPerPortion = recipe.portions > 0 ? totalCost / recipe.portions : 0;

  return {
    totalCost,
    costPerPortion,
  };
}
