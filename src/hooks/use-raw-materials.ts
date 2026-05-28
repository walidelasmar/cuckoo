'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const loadMaterials = useCallback(async () => {
    if (!orgId) { setMaterials([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data } = await supabase.from('raw_materials').select('data').eq('org_id', orgId).eq('id', ORG_ROW_ID(orgId)).maybeSingle();
    setMaterials((data?.data as RawMaterial[]) || []);
    setIsLoading(false);
  }, [orgId]);

  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  const saveMaterials = useCallback(async (updated: RawMaterial[]) => {
    if (!orgId) return;
    await supabase.from('raw_materials').upsert({ id: ORG_ROW_ID(orgId), org_id: orgId, data: updated, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    setMaterials(updated);
    await syncMaterialLists(updated, orgId);
  }, [orgId]);

  const addMaterial = useCallback(async (material: RawMaterial) => {
    const updated = [...materials, material];
    await saveMaterials(updated);
  }, [materials, saveMaterials]);

  const updateMaterial = useCallback(async (id: string, updates: Partial<RawMaterial>) => {
    const updated = materials.map(m => m.id === id ? { ...m, ...updates } : m);
    await saveMaterials(updated);
  }, [materials, saveMaterials]);

  const deleteMaterial = useCallback(async (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    await saveMaterials(updated);
  }, [materials, saveMaterials]);

  return { materials, isLoading, addMaterial, updateMaterial, deleteMaterial };
}
