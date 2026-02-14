'use client';

import { useState, useEffect } from 'react';
import type { RawMaterial } from '@/lib/types';
import { rawMaterials as initialRawMaterials } from '@/lib/data';

const LOCAL_STORAGE_KEY = 'rawMaterials';

export function useRawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedItems) {
        setMaterials(JSON.parse(storedItems));
      } else {
        // Seed with initial data if localStorage is empty
        setMaterials(initialRawMaterials);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialRawMaterials));
      }
    } catch (error) {
      console.error("Failed to access localStorage", error);
      // Fallback to initial data if localStorage is not available
      setMaterials(initialRawMaterials);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateLocalStorage = (updatedMaterials: RawMaterial[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedMaterials));
  };

  const addMaterial = (newMaterialData: Omit<RawMaterial, 'id'>) => {
    const newMaterial: RawMaterial = {
      ...newMaterialData,
      id: `mat-${Date.now()}`, // NOTE: Not a robust way to generate IDs
    };
    const updatedMaterials = [newMaterial, ...materials];
    setMaterials(updatedMaterials);
    updateLocalStorage(updatedMaterials);
    return newMaterial;
  };

  const updateMaterial = (id: string, updatedMaterialData: Partial<Omit<RawMaterial, 'id'>>) => {
    const updatedMaterials = materials.map((material) =>
      material.id === id ? { ...material, ...updatedMaterialData } : material
    );
    setMaterials(updatedMaterials);
    updateLocalStorage(updatedMaterials);
  };

  const deleteMaterial = (id: string) => {
    const updatedMaterials = materials.filter((material) => material.id !== id);
    setMaterials(updatedMaterials);
    updateLocalStorage(updatedMaterials);
  };

  return { materials, isLoading, addMaterial, updateMaterial, deleteMaterial };
}
