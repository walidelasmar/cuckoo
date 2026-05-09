import { Unit } from './types';

export const UNITS: { value: Unit; label: string }[] = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'tsp', label: 'Teaspoon (tsp)' },
  { value: 'tbsp', label: 'Tablespoon (tbsp)' },
  { value: 'cup', label: 'Cup' },
  { value: 'pc', label: 'Piece(s) (pc)' },
  ];

export const UNIT_CATEGORIES: { [key in Unit]: 'weight' | 'volume' | 'count' } = {
    g: 'weight',
    kg: 'weight',
    oz: 'weight',
    lb: 'weight',
    ml: 'volume',
    l: 'volume',
    tsp: 'volume',
    tbsp: 'volume',
    cup: 'volume',
    pc: 'count',
}

export const ALLERGENS = [
    'Dairy',
    'Eggs',
    'Peanuts',
    'Nuts',
    'Fish',
    'Crustaceans',
    'Soybeans',
    'Gluten',
    'Sesame',
    'Molluscs',
    'Celery',
    'Mustard',
    'Lupin',
    'Sulphites',
    'Mushroom',
    'Soybeans (Soya)',
  ] as const;

export const ALLERGEN_ICONS: { [key: string]: string } = {
    'Dairy': 'dairy',
    'Eggs': 'eggs',
    'Peanuts': 'peanuts',
    'Nuts': 'nuts',
    'Fish': 'fish',
    'Crustaceans': 'crustaceans',
    'Soybeans': 'soybeans',
    'Gluten': 'gluten',
    'Sesame': 'sesame',
    'Molluscs': 'molluscs',
    'Celery': 'celery',
    'Mustard': 'mustard',
    'Lupin': 'lupin',
    'Sulphites': 'sulphites',
    'Mushroom': 'mushroom',
    'Soybeans (Soya)': 'soybeans',
};

export const ALLERGEN_THEMES: { [key: string]: string } = {
    'Dairy': 'dairy',
    'Eggs': 'eggs',
    'Peanuts': 'peanuts',
    'Nuts': 'nuts',
    'Fish': 'fish',
    'Crustaceans': 'crustaceans',
    'Soybeans': 'soybeans',
    'Gluten': 'gluten',
    'Sesame': 'sesame',
    'Molluscs': 'molluscs',
    'Celery': 'celery',
    'Mustard': 'mustard',
    'Lupin': 'lupin',
    'Sulphites': 'sulphites',
    'Mushroom': 'mushroom',
    'Soybeans (Soya)': 'soybeans',
};
