'use client';

import { useState, useEffect } from 'react';
import type { RawMaterial } from '@/lib/types';
import { rawMaterials as initialRawMaterials } from '@/lib/data';
import { syncMaterialLists } from '@/lib/lists';

const LOCAL_STORAGE_KEY = 'rawMaterials';

export function useRawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedItems) {
        const parsed: RawMaterial[] = JSON.parse(storedItems);
        setMaterials(parsed);
        syncMaterialLists(parsed);
      } else {
        setMaterials(initialRawMaterials);
        syncMaterialLists(initialRawMaterials);
      }
    } catch {
      setMaterials(initialRawMaterials);
    }
    setIsLoading(false);
  }, []);

  const updateLocalStorage = (updatedMaterials: RawMaterial[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedMaterials));
  };

  const addMaterial = (newMaterialData: Omit<RawMaterial, 'id'>): RawMaterial => {
    const newMaterial: RawMaterial = {
      ...newMaterialData,
      id: `mat-${Date.now()}`, // NOTE: Not a real DB ID
    };
    const updatedMaterials = [newMaterial, ...materials];
    setMaterials(updatedMaterials);
    updateLocalStorage(updatedMaterials);
    syncMaterialLists(updatedMaterials);
    return newMaterial;
  };

  const updateMaterial = (id: string, updatedData: Partial<Omit<RawMaterial, 'id'>>) => {
    const updatedMaterials = materials.map((material) =>
      material.id === id ? { ...material, ...updatedData } : material
    );
    setMaterials(updatedMaterials);
    updateLocalStorage(updatedMaterials);
    syncMaterialLists(updatedMaterials);
  };

  const deleteMaterial = (id: string) => {
    const updatedMaterials = materials.filter((material) => material.id !== id);
    setMaterials(updatedMaterials);
    updateLocalStorage(updatedMaterials);
    syncMaterialLists(updatedMaterials);
  };

  return { materials, isLoading, addMaterial, updateMaterial, deleteMaterial };
}
