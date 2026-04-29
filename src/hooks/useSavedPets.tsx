// [SAVED-PETS] global saved-pets state — AsyncStorage-only, same pattern as liked pets/posts
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import RemoveSavedSheet from '../components/RemoveSavedSheet';

// [SAVED-PETS] AsyncStorage key — separate from savedPosts (community posts)
const savedKey = (uid: string) => `${uid}_savedPetIds`;

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
  const [savedIdsList, setSavedIdsList] = useState<string[]>([]);
  const [savedPets, setSavedPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<any | null>(null);

  // [SAVED-PETS] derived from AsyncStorage IDs — used to drive bookmark icon state everywhere
  const savedIds = useMemo(() => new Set<string>(savedIdsList), [savedIdsList]);

  // [SAVED-PETS] read IDs from AsyncStorage, then fetch full pet objects for SavedPetsScreen
  const refresh = useCallback(async () => {
    const uid = await AsyncStorage.getItem('userId');
    setUserId(uid);
    if (!uid) { setSavedIdsList([]); setSavedPets([]); setLoading(false); return; }
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(savedKey(uid));
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setSavedIdsList(ids);
      if (ids.length === 0) { setSavedPets([]); return; }
      const allPets = await api.getAllPets();
      setSavedPets((allPets || []).filter((p: any) => ids.includes(p.id)));
    } catch (e) {
      console.error('[SAVED-PETS] refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // [SAVED-PETS] save: write ID to AsyncStorage immediately (optimistic), no backend call
  const save = useCallback(async (petId: string) => {
    const uid = userId || (await AsyncStorage.getItem('userId'));
    if (!uid) return;
    if (savedIds.has(petId)) return;
    Haptics.selectionAsync().catch(() => {});
    const newIds = [...savedIdsList, petId];
    setSavedIdsList(newIds);
    await AsyncStorage.setItem(savedKey(uid), JSON.stringify(newIds));
  }, [userId, savedIds, savedIdsList]);

  const requestRemove = useCallback((pet: any) => {
    setRemoveTarget(pet);
  }, []);

  // [SAVED-PETS] remove: delete ID from AsyncStorage immediately, no backend call
  const confirmRemove = useCallback(async () => {
    if (!removeTarget) return;
    const uid = userId || (await AsyncStorage.getItem('userId'));
    if (!uid) return;
    Haptics.selectionAsync().catch(() => {});
    const petId = removeTarget.id;
    const newIds = savedIdsList.filter((id) => id !== petId);
    setSavedIdsList(newIds);
    setSavedPets((prev) => prev.filter((p) => p.id !== petId));
    setRemoveTarget(null);
    await AsyncStorage.setItem(savedKey(uid), JSON.stringify(newIds));
  }, [userId, removeTarget, savedIdsList]);

  const value: ContextValue = { savedIds, savedPets, loading, refresh, save, requestRemove };

  return (
    <SavedPetsContext.Provider value={value}>
      {children}
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
