'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rawMaterials } from '@/lib/data';
import type { RawMaterial } from '@/lib/types';

const formSchema = z.object({
  name: z.string().optional(),
  shortName: z.string().min(1, { message: 'Short name is required.' }),
  category: z.string().optional(),
  provider: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: 'Quantity must be positive.' }),
  unit: z.enum(['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece']),
  cost: z.coerce.number().min(0, { message: 'Cost must be positive.' }),
});

export async function createMaterial(data: z.infer<typeof formSchema>) {
  // This is a mock implementation. In a real application, you would save to a database.
  const newMaterial: RawMaterial = {
    id: `mat-${Date.now()}`, // NOTE: Not a robust way to generate IDs
    ...data,
  };
  rawMaterials.push(newMaterial);
  revalidatePath('/dashboard/materials');
  return { success: true, material: newMaterial };
}

export async function updateMaterial(
  id: string,
  data: z.infer<typeof formSchema>
) {
  // This is a mock implementation. In a real application, you would update in a database.
  const materialIndex = rawMaterials.findIndex((m) => m.id === id);
  if (materialIndex === -1) {
    return { success: false, error: 'Material not found' };
  }
  const updatedMaterial = {
    ...rawMaterials[materialIndex],
    ...data,
  };
  rawMaterials[materialIndex] = updatedMaterial;
  revalidatePath('/dashboard/materials');
  return { success: true, material: updatedMaterial };
}
