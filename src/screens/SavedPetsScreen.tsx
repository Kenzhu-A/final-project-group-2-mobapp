// [SAVED-PETS] Saved tab — mirrors Dashboard but scoped to saved pets
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useSavedPets } from '../hooks/useSavedPets';
import PetCard from '../components/PetCard';

const CATEGORY_OPTIONS = [
  { key: 'All', dbValue: null },
  { key: 'Dogs', dbValue: 'Dog' },
  { key: 'Cats', dbValue: 'Cat' },
  { key: 'Birds', dbValue: 'Bird' },
  { key: 'Rabbits', dbValue: 'Rabbit' },
  { key: 'Other', dbValue: 'Other' },
];

const FILTERS_KEY = 'savedFilters_v1';

export default function SavedPetsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { savedPets, loading, refresh } = useSavedPets();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filters, setFilters] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FILTERS_KEY).then((v) => {
      if (v) { try { setFilters(JSON.parse(v)); } catch {} }
    });
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: savedPets.length };
    for (const opt of CATEGORY_OPTIONS) {
      if (opt.dbValue) c[opt.key] = savedPets.filter((p) => p.category === opt.dbValue).length;
    }
    return c;
  }, [savedPets]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return savedPets.filter((p) => {
      if (selectedCategory !== 'All') {
        const opt = CATEGORY_OPTIONS.find((o) => o.key === selectedCategory);
        if (opt?.dbValue && p.category !== opt.dbValue) return false;
      }
      if (q) {
        const hay = `${p.pet_name || ''} ${p.breed || ''} ${p.location || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.species?.length && !filters.species.includes(p.category)) return false;
      if (filters.size?.length && !filters.size.includes(p.size)) return false;
      if (filters.maxPrice != null && (p.price ?? 0) > filters.maxPrice) return false;
      if (filters.city && !(p.location || '').toLowerCase().includes(filters.city.toLowerCase())) return false;
      return true;
    });
  }, [savedPets, selectedCategory, debouncedSearch, filters]);

  const openFilter = () => {
    navigation.navigate('FilterScreen', {
      initialFilters: filters,
      pets: savedPets,
      onApply: (next: any) => {
        setFilters(next);
        AsyncStorage.setItem(FILTERS_KEY, JSON.stringify(next)).catch(() => {});
      },
    });
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.textSecondary }}>Loading…</Text></View>;
  }

  const Header = (
    <View>
      <Text style={[styles.title, { color: colors.textPrimary, paddingHorizontal: 20 }]}>Saved posts</Text>

      <View style={[styles.searchRow, { paddingHorizontal: 20 }]}>
        <View style={[styles.searchPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search breed, shelter, name"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.accent }]} onPress={openFilter}>
          <Ionicons name="options" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, paddingLeft: 20 }}>
        {CATEGORY_OPTIONS.map((opt) => {
          const active = selectedCategory === opt.key;
          return (
            <TouchableOpacity key={opt.key} onPress={() => setSelectedCategory(opt.key)}
              style={[styles.chip, { borderColor: colors.border }, active && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}>
              <Text style={[styles.chipText, { color: active ? '#FFF' : colors.textPrimary }]}>{opt.key}</Text>
              <Text style={[styles.chipCount, { color: active ? '#FFF' : colors.textSecondary }]}> {counts[opt.key] ?? 0}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ width: 20 }} />
      </ScrollView>

      <Text style={[styles.eyebrow, { color: colors.textSecondary, paddingHorizontal: 20 }]}>{filtered.length} SAVED PETS</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 110, gap: 12 }}
        ListHeaderComponent={Header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Ionicons name="bookmark-outline" size={56} color={colors.border} />
            <Text style={{ color: colors.textPrimary, fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 12 }}>
              {savedPets.length === 0 ? 'No saved pets yet.' : 'No matches for your filters.'}
            </Text>
            {savedPets.length === 0 && (
              <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginTop: 6 }}>
                Tap the bookmark on any pet to save it for later.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <PetCard pet={item} onPress={() => navigation.navigate('PetDetailsScreen', { petId: item.id })} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontFamily: 'DMSerifDisplay_400Regular', marginTop: 8, marginBottom: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchPill: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 22, paddingHorizontal: 14, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  filterBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  chipCount: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  eyebrow: { fontSize: 11, fontFamily: 'DMSans_700Bold', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
});
