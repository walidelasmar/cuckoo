export type Unit =
  | 'g'
  | 'kg'
  | 'oz'
  | 'lb'
  | 'ml'
  | 'l'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'pc';

export type RawMaterial = {
  id: string;
  category: string;
  name: string;
  shortName: string;
  provider: string;
  sku: string;
  quantity: number;
  unit: Unit;
  cost: number;
};

export type Ingredient = {
  id: string;
  rawMaterial: RawMaterial;
  quantity: number;
  unit: Unit;
};

export type Recipe = {
  id: string;
  name: string;
  category: string;
  description: string;
  portions: number;
  ingredients: Ingredient[];
};
