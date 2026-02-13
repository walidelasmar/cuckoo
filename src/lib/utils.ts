import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Recipe, Unit } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


const CONVERSIONS_TO_BASE: { [key in Unit]?: { base: 'g' | 'ml'; value: number } } = {
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


export function calculateRecipeCost(recipe: Recipe) {
  let totalCost = 0;

  for (const ingredient of recipe.ingredients) {
    const rawMaterial = ingredient.rawMaterial;

    if (!rawMaterial) continue;

    // Direct piece-to-piece calculation
    if (ingredient.unit === 'pc' && rawMaterial.unit === 'pc') {
        totalCost += (ingredient.quantity / rawMaterial.quantity) * rawMaterial.cost;
        continue;
    }
    
    const ingredientConversion = CONVERSIONS_TO_BASE[ingredient.unit];
    const materialConversion = CONVERSIONS_TO_BASE[rawMaterial.unit];
    
    // Check for compatibility (both weight or both volume)
    if(ingredientConversion && materialConversion && ingredientConversion.base === materialConversion.base) {
        const ingredientInBase = ingredient.quantity * ingredientConversion.value;
        const materialInBase = rawMaterial.quantity * materialConversion.value;

        if (materialInBase > 0) {
            totalCost += (ingredientInBase / materialInBase) * rawMaterial.cost;
        }
    } else {
        // In a real app, you would handle this incompatibility error more gracefully
        console.warn(`Incompatible units for ingredient ${rawMaterial.name}: ${ingredient.unit} vs ${rawMaterial.unit}`);
    }
  }

  const costPerPortion = recipe.portions > 0 ? totalCost / recipe.portions : 0;

  return {
    totalCost,
    costPerPortion,
  };
}
