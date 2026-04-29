// [DASHBOARD-REDESIGN] full adoption listing — navigated to from "See all" on Dashboard
import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { api } from '../services/api';
import PetCard from '../components/PetCard';

const CATEGORY_OPTIONS = [
  { key: 'All', dbValue: null },
  { key: 'Dogs', dbValue: 'Dog' },
  { key: 'Cats', dbValue: 'Cat' },
  { key: 'Birds', dbValue: 'Bird' },
  { key: 'Rabbits', dbValue: 'Rabbit' },
  { key: 'Other', dbValue: 'Other' },
];

// [DASHBOARD-REDESIGN] spacer keeps the last lone card half-width in a 2-col grid
const SPACER_ID = '__spacer__';
function withSpacer(data: any[]) {
  return data.length % 2 !== 0 ? [...data, { id: SPACER_ID }] : data;
}

export default function AllPetsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchPets = useCallback(async () => {
    try {
      const data = await api.getAllPets();
      setPets(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchPets(); }, [fetchPets]));
  const onRefresh = () => { setRefreshing(true); fetchPets(); };

  const openFilter = () => {
    navigation.navigate('FilterScreen', {
      initialFilters: {},
      pets,
      onApply: () => {},
    });
  };

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return pets.filter((p) => {
      if (selectedCategory !== 'All') {
        const opt = CATEGORY_OPTIONS.find((o) => o.key === selectedCategory);
        if (opt?.dbValue && p.category !== opt.dbValue) return false;
      }
      if (q) {
        const hay = `${p.pet_name || ''} ${p.breed || ''} ${p.location || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pets, selectedCategory, debouncedSearch]);

  const Header = (
    <View>
      {/* search + filter */}
      <View style={[styles.searchRow, { paddingHorizontal: 16 }]}>
        <View style={[styles.searchPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by name, breed, location"
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

      {/* category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, paddingLeft: 16 }}>
        {CATEGORY_OPTIONS.map((opt) => {
          const active = selectedCategory === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSelectedCategory(opt.key)}
              style={[styles.chip, { borderColor: colors.border }, active && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}
            >
              <Text style={[styles.chipText, { color: active ? '#FFF' : colors.textPrimary }]}>{opt.key}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ width: 16 }} />
      </ScrollView>

      <Text style={[styles.count, { color: colors.textSecondary, paddingHorizontal: 16, marginTop: 12 }]}>
        {filtered.length} pet{filtered.length !== 1 ? 's' : ''} available
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>All Pets</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={withSpacer(filtered)}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40, gap: 12 }}
          ListHeaderComponent={Header}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Ionicons name="paw-outline" size={56} color={colors.border} />
              <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', marginTop: 12 }}>
                No pets match your filters.
              </Text>
              <TouchableOpacity onPress={() => { setSearch(''); setSelectedCategory('All'); }} style={{ marginTop: 12 }}>
                <Text style={{ color: colors.primary, fontFamily: 'DMSans_700Bold' }}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            if (item.id === SPACER_ID) return <View style={{ flex: 1 }} />;
            return <PetCard pet={item} onPress={() => navigation.navigate('PetDetailsScreen', { petId: item.id })} />;
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  searchPill: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 22, paddingHorizontal: 14, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  filterBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  count: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
});
