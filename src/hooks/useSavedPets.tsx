// [SAVED-PETS] global saved-pets state — used by Dashboard, Saved tab, PetDetails
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import RemoveSavedSheet from '../components/RemoveSavedSheet';

interface ContextValue {
  savedIds: Set<string>;
  savedPets: any[];
  loading: boolean;
  refresh: () => Promise<void>;
  save: (petId: string) => Promise<void>;
  requestRemove: (pet: any) => void;
}

const SavedPetsContext = createContext<ContextValue | undefined>(undefined);

export function SavedPetsProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [savedPets, setSavedPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<any | null>(null);

  const savedIds = useMemo(() => new Set<string>(savedPets.map((p) => p.id)), [savedPets]);

  const refresh = useCallback(async () => {
    const uid = await AsyncStorage.getItem('userId');
    setUserId(uid);
    if (!uid) { setSavedPets([]); setLoading(false); return; }
    setLoading(true);
    try {
      const list = await api.getSavedPets(uid);
      setSavedPets(list || []);
    } catch (e) {
      console.error('[SAVED-PETS] refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (petId: string) => {
    // [DASHBOARD-REDESIGN] read userId directly from storage to avoid stale closure
    const uid = userId || (await AsyncStorage.getItem('userId'));
    if (!uid) return;
    if (savedIds.has(petId)) return;
    Haptics.selectionAsync().catch(() => {});
    try {
      await api.savePet(uid, petId);
      await refresh();
    } catch (e: any) {
      Alert.alert('Save failed', e.message || 'Could not save this pet. Make sure the backend is running.');
    }
  }, [userId, savedIds, refresh]);

  const requestRemove = useCallback((pet: any) => {
    setRemoveTarget(pet);
  }, []);

  const confirmRemove = useCallback(async () => {
    if (!userId || !removeTarget) return;
    const petId = removeTarget.id;
    Haptics.selectionAsync().catch(() => {});
    // optimistic: drop immediately
    setSavedPets((prev) => prev.filter((p) => p.id !== petId));
    setRemoveTarget(null);
    try {
      await api.unsavePet(userId, petId);
    } catch (e: any) {
      Alert.alert('Unsave failed', e.message || 'Could not remove this pet.');
      await refresh();
    }
  }, [userId, removeTarget, refresh]);

  const value: ContextValue = { savedIds, savedPets, loading, refresh, save, requestRemove };

  return (
    <SavedPetsContext.Provider value={value}>
      {children}
      {/* Single global sheet — only one exists in the tree, no stacking */}
      <RemoveSavedSheet
        visible={!!removeTarget}
        pet={removeTarget}
        onConfirm={confirmRemove}
        onDismiss={() => setRemoveTarget(null)}
      />
    </SavedPetsContext.Provider>
  );
}

export function useSavedPets(): ContextValue {
  const ctx = useContext(SavedPetsContext);
  if (!ctx) throw new Error('useSavedPets must be used inside SavedPetsProvider');
  return ctx;
}
