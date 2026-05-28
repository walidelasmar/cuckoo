'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RawMaterial } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { syncMaterialLists } from '@/lib/lists';
import { useAuth } from '@/hooks/use-auth';

const ORG_ROW_ID = (orgId: string) => `rm-${orgId}`;

export function useRawMaterials() {
  const { currentUser } = useAuth();
  const orgId = currentUser?.orgId || '';

  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const materialsRef = useRef<RawMaterial[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    materialsRef.current = materials;
  }, [materials]);

  const loadMaterials = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    const { data } = await supabase.from('raw_materials').select('data').eq('org_id', orgId).eq('id', ORG_ROW_ID(orgId)).maybeSingle();
    setMaterials(data?.data ?? []);
    setIsLoading(false);
  }, [orgId]);

  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  const saveMaterials = useCallback(async (updated: RawMaterial[]) => {
    if (!orgId) return;
    await supabase.from('raw_materials').upsert({ id: ORG_ROW_ID(orgId), org_id: orgId, data: updated, updated_at: new Date().toISOString() });
    setMaterials(updated);
    await syncMaterialLists(updated, orgId);
  }, [orgId]);

  const addMaterial = useCallback(async (material: Omit<RawMaterial, 'id'>) => {
    const newItem: RawMaterial = { ...material, id: crypto.randomUUID() };
    const updated = [...materialsRef.current, newItem];
    await saveMaterials(updated);
  }, [saveMaterials]);

  const addMaterials = useCallback(async (batch: Omit<RawMaterial, 'id'>[]) => {
    const newItems: RawMaterial[] = batch.map(m => ({ ...m, id: crypto.randomUUID() }));
    const updated = [...materialsRef.current, ...newItems];
    await saveMaterials(updated);
  }, [saveMaterials]);

  const updateMaterial = useCallback(async (id: string, updates: Partial<Omit<RawMaterial, 'id'>>) => {
    const updated = materialsRef.current.map(m => m.id === id ? { ...m, ...updates } : m);
    await saveMaterials(updated);
  }, [saveMaterials]);

  const deleteMaterial = useCallback(async (id: string) => {
    const updated = materialsRef.current.filter(m => m.id !== id);
    await saveMaterials(updated);
  }, [saveMaterials]);

  const deleteAllMaterials = useCallback(async () => {
    await saveMaterials([]);
  }, [saveMaterials]);

  return { materials, isLoading, addMaterial, addMaterials, updateMaterial, deleteMaterial, deleteAllMaterials };
}
