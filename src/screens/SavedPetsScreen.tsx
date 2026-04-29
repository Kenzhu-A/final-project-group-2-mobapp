// [SAVED-PETS] Saved tab — two sub-tabs: Pets (AsyncStorage) + Posts (AsyncStorage)
import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSavedPets } from '../hooks/useSavedPets';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { api } from '../services/api';
import PetCard from '../components/PetCard';
import GeneralPostCard from '../components/GeneralPostCard';

type Tab = 'pets' | 'posts';

const CATEGORY_OPTIONS = [
  { key: 'All', dbValue: null },
  { key: 'Dogs', dbValue: 'Dog' },
  { key: 'Cats', dbValue: 'Cat' },
  { key: 'Birds', dbValue: 'Bird' },
  { key: 'Rabbits', dbValue: 'Rabbit' },
  { key: 'Other', dbValue: 'Other' },
];

// [SAVED-PETS] spacer keeps the last lone card half-width in a 2-col grid
const SPACER_ID = '__spacer__';
function withSpacer(data: any[]) {
  return data.length % 2 !== 0 ? [...data, { id: SPACER_ID }] : data;
}

export default function SavedPetsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { savedPets, loading: petsLoading, refresh: refreshPets } = useSavedPets();

  const [activeTab, setActiveTab] = useState<Tab>('pets');
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pets tab filter state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // [SAVED-PETS] load saved posts: read IDs from AsyncStorage, fetch all posts, filter
  const loadSavedPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const uid = await AsyncStorage.getItem('userId');
      if (!uid) { setSavedPosts([]); return; }
      const [stored, allPosts] = await Promise.all([
        AsyncStorage.getItem(`${uid}_savedPosts`),
        api.getGeneralPosts(),
      ]);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      setSavedPosts((allPosts || []).filter((p: any) => ids.includes(p.id)));
    } catch (e) {
      console.error('[SAVED-PETS] loadSavedPosts failed', e);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([refreshPets(), loadSavedPosts()]);
  }, [refreshPets, loadSavedPosts]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const filteredPets = useMemo(() => {
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
      return true;
    });
  }, [savedPets, selectedCategory, debouncedSearch]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = { All: savedPets.length };
    for (const opt of CATEGORY_OPTIONS) {
      if (opt.dbValue) c[opt.key] = savedPets.filter((p) => p.category === opt.dbValue).length;
    }
    return c;
  }, [savedPets]);

  const loading = petsLoading || postsLoading;

  // Header shown above the pets grid (search + chips + count)
  const PetsHeader = (
    <View style={{ paddingTop: 12 }}>
      <View style={[styles.searchRow, { paddingHorizontal: 20 }]}>
        <View style={[styles.searchPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search breed, name, location"
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
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, paddingLeft: 20 }}>
        {CATEGORY_OPTIONS.map((opt) => {
          const active = selectedCategory === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSelectedCategory(opt.key)}
              style={[styles.chip, { borderColor: colors.border }, active && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}
            >
              <Text style={[styles.chipText, { color: active ? '#FFF' : colors.textPrimary }]}>{opt.key}</Text>
              <Text style={[styles.chipCount, { color: active ? '#FFF' : colors.textSecondary }]}>
                {' '}{categoryCounts[opt.key] ?? 0}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ width: 20 }} />
      </ScrollView>

      <Text style={[styles.eyebrow, { color: colors.textSecondary, paddingHorizontal: 20, marginTop: 14, marginBottom: 4 }]}>
        {filteredPets.length} SAVED PET{filteredPets.length !== 1 ? 'S' : ''}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* screen title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>Saved</Text>

      {/* [SAVED-PETS] tabs — same underline style as LikedPetsAndPostsScreen */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['pets', 'posts'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={styles.tab} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, { color: activeTab === t ? colors.primary : colors.textSecondary }]}>
              {t === 'pets' ? `Pets (${savedPets.length})` : `Posts (${savedPosts.length})`}
            </Text>
            {activeTab === t && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : activeTab === 'pets' ? (
        // [SAVED-PETS] Pets tab — AsyncStorage IDs → full objects via useSavedPets
        <FlatList
          data={withSpacer(filteredPets)}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingBottom: 110, gap: 12 }}
          ListHeaderComponent={PetsHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {savedPets.length === 0 ? 'No saved pets yet.' : 'No matches found.'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {savedPets.length === 0
                  ? 'Tap the bookmark on any pet card to save it for later.'
                  : 'Try a different search or category.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.id === SPACER_ID) return <View style={{ flex: 1 }} />;
            return <PetCard pet={item} onPress={() => navigation.navigate('PetDetailsScreen', { petId: item.id })} />;
          }}
        />
      ) : (
        // [SAVED-PETS] Posts tab — AsyncStorage ${uid}_savedPosts IDs → GeneralPostCard
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 110 }}
        >
          {savedPosts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved posts yet.</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Tap the bookmark on any community post to save it here.
              </Text>
            </View>
          ) : (
            savedPosts.map((post) => (
              <GeneralPostCard
                key={post.id}
                item={post}
                colors={colors}
                // [SAVED-PETS] real-time removal — drop from list the moment bookmark is toggled off
                onUnsave={(id: string) => setSavedPosts((prev) => prev.filter((p) => String(p.id) !== String(id)))}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontFamily: 'DMSerifDisplay_400Regular', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabText: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  tabUnderline: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, borderRadius: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    height: 44, borderRadius: 22, paddingHorizontal: 14, borderWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  chipText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  chipCount: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  eyebrow: { fontSize: 11, fontFamily: 'DMSans_700Bold', letterSpacing: 1 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 12 },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 6, textAlign: 'center' },
});
