import type { RawMaterial, Recipe } from './types';

export const rawMaterials: RawMaterial[] = [
  {
    id: 'mat-1',
    category: 'Flour',
    name: 'All-Purpose Flour',
    shortName: 'APF',
    provider: 'Grain Co.',
    sku: 'GC-APF-25KG',
    quantity: 25,
    unit: 'kg',
    price: 30.0,
  },
  {
    id: 'mat-2',
    category: 'Dairy',
    name: 'Whole Milk',
    shortName: 'MILK',
    provider: 'Farm Fresh',
    sku: 'FF-WM-1G',
    quantity: 1,
    unit: 'l',
    price: 3.5,
  },
  {
    id: 'mat-3',
    category: 'Produce',
    name: 'Large Brown Eggs',
    shortName: 'EGGS',
    provider: 'Happy Hens',
    sku: 'HH-LBE-12CT',
    quantity: 12,
    unit: 'piece',
    price: 4.0,
  },
  {
    id: 'mat-4',
    category: 'Spices',
    name: 'Granulated Sugar',
    shortName: 'SUGAR',
    provider: 'Sweet Supply',
    sku: 'SS-GS-10LB',
    quantity: 10,
    unit: 'lb',
    price: 8.0,
  },
   {
    id: 'mat-5',
    category: 'Produce',
    name: 'Yellow Onions',
    shortName: 'ONION',
    provider: 'Veggie Vendor',
    sku: 'VV-YO-50LB',
    quantity: 50,
    unit: 'lb',
    price: 25.00
  },
  {
    id: 'mat-6',
    category: 'Meat',
    name: 'Ground Beef 80/20',
    shortName: 'GBEEF',
    provider: 'Butcher Block',
    sku: 'BB-GB-10LB',
    quantity: 10,
    unit: 'lb',
    price: 45.00
  },
];

export const recipes: Recipe[] = [
  {
    id: 'rec-1',
    name: 'Classic Pancakes',
    category: 'Breakfast',
    description: 'Fluffy, homemade pancakes from scratch.',
    portions: 4,
    ingredients: [
      {
        id: 'ing-1-1',
        rawMaterial: rawMaterials.find((m) => m.shortName === 'APF')!,
        quantity: 200,
        unit: 'g',
      },
      {
        id: 'ing-1-2',
        rawMaterial: rawMaterials.find((m) => m.shortName === 'MILK')!,
        quantity: 250,
        unit: 'ml',
      },
      {
        id: 'ing-1-3',
        rawMaterial: rawMaterials.find((m) => m.shortName === 'EGGS')!,
        quantity: 2,
        unit: 'piece',
      },
      {
        id: 'ing-1-4',
        rawMaterial: rawMaterials.find((m) => m.shortName === 'SUGAR')!,
        quantity: 2,
        unit: 'tbsp',
      },
    ],
  },
  {
    id: 'rec-2',
    name: 'Simple Burger',
    category: 'Lunch',
    description: 'A classic beef burger.',
    portions: 4,
    ingredients: [
       {
        id: 'ing-2-1',
        rawMaterial: rawMaterials.find((m) => m.shortName === 'GBEEF')!,
        quantity: 2,
        unit: 'lb',
      },
      {
        id: 'ing-2-2',
        rawMaterial: rawMaterials.find((m) => m.shortName === 'ONION')!,
        quantity: 1,
        unit: 'piece',
      },
    ]
  }
];
