// [DASHBOARD-REDESIGN] main dashboard — rendered by HomeScreen for activeTab === 'home'
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  FlatList, Image, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../context/ThemeContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { api } from '../services/api';
import PetCard from '../components/PetCard';
import HeroCarousel from '../components/HeroCarousel';
import GeneralPostCard from '../components/GeneralPostCard'; // [COMMUNITY-FEED]

const CATEGORY_OPTIONS = [
  { key: 'All', dbValue: null },
  { key: 'Dogs', dbValue: 'Dog' },
  { key: 'Cats', dbValue: 'Cat' },
  { key: 'Birds', dbValue: 'Bird' },
  { key: 'Rabbits', dbValue: 'Rabbit' },
  { key: 'Other', dbValue: 'Other' },
];

const CATEGORY_KEY = 'lastSelectedCategory_v1';
const FILTERS_KEY = 'dashboardFilters_v1';

function getGreeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function firstName(fullName?: string): string {
  if (!fullName) return 'there';
  return fullName.trim().split(/\s+/)[0];
}

interface Filters {
  species?: string[];
  ageBucket?: string;
  size?: string[];
  maxPrice?: number;
  city?: string;
}

export default function DashboardScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]); // [COMMUNITY-FEED]
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filters, setFilters] = useState<Filters>({});

  // restore persisted category & filters
  useEffect(() => {
    (async () => {
      const cat = await AsyncStorage.getItem(CATEGORY_KEY);
      if (cat) setSelectedCategory(cat);
      const f = await AsyncStorage.getItem(FILTERS_KEY);
      if (f) { try { setFilters(JSON.parse(f)); } catch {} }
    })();
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [petList, userId, postList] = await Promise.all([
        api.getAllPets(),
        AsyncStorage.getItem('userId'),
        api.getGeneralPosts(), // [COMMUNITY-FEED]
      ]);
      setPets(petList || []);
      setCommunityPosts(postList || []); // [COMMUNITY-FEED]
      if (userId) {
        try { setProfile(await api.getUserProfile(userId)); } catch {}
      }
    } catch (e) {
      console.error('[DASHBOARD] fetch failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const onSelectCategory = async (key: string) => {
    setSelectedCategory(key);
    AsyncStorage.setItem(CATEGORY_KEY, key).catch(() => {});
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: pets.length };
    for (const opt of CATEGORY_OPTIONS) {
      if (opt.dbValue) c[opt.key] = pets.filter((p) => p.category === opt.dbValue).length;
    }
    return c;
  }, [pets]);

  const filteredPets = useMemo(() => {
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
      if (filters.species?.length && !filters.species.includes(p.category)) return false;
      if (filters.size?.length && !filters.size.includes(p.size)) return false;
      if (filters.maxPrice != null && (p.price ?? 0) > filters.maxPrice) return false;
      if (filters.city && !(p.location || '').toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.ageBucket) {
        const a = p.age ?? 0;
        const ok =
          (filters.ageBucket === 'puppy' && a < 1) ||
          (filters.ageBucket === 'young' && a >= 1 && a < 3) ||
          (filters.ageBucket === 'adult' && a >= 3 && a < 8) ||
          (filters.ageBucket === 'senior' && a >= 8);
        if (!ok) return false;
      }
      return true;
    });
  }, [pets, selectedCategory, debouncedSearch, filters]);

  const featuredPet = useMemo(() => pets.find((p) => p.image_url || (p.image_urls && p.image_urls.length > 0)), [pets]);

  const handleSayHi = (pet: any) => {
    navigation.navigate('ChatScreen', {
      receiverId: pet.owner_id,
      receiverName: pet.owner?.full_name || 'Pet Owner',
      initialMessage: `Hi! I'm interested in adopting ${pet.pet_name}. 🐾`,
    });
  };

  const openFilter = () => {
    navigation.navigate('FilterScreen', {
      initialFilters: filters,
      pets,
      onApply: (next: Filters) => {
        setFilters(next);
        AsyncStorage.setItem(FILTERS_KEY, JSON.stringify(next)).catch(() => {});
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const ListHeader = (
    <View>
      {/* greeting row */}
      <View style={[styles.greetRow, { paddingHorizontal: 20 }]}>
        <View>
          <Text style={[styles.greetSmall, { color: colors.textSecondary }]}>{getGreeting()},</Text>
          <Text style={[styles.greetBig, { color: colors.textPrimary }]}>{firstName(profile?.full_name)}!</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('ChatNotifications')} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={[styles.avatar, { borderColor: colors.primary }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={styles.avatarLetter}>{firstName(profile?.full_name).charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* search row */}
      <View style={[styles.searchRow, { paddingHorizontal: 20 }]}>
        <View style={[styles.searchPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by name, breed, location"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
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

      {/* [HERO-CAROUSEL] always render — handles null featuredPet gracefully */}
      <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
        <HeroCarousel
          featuredPet={featuredPet || null}
          onPressFeatured={() => featuredPet && navigation.navigate('PetDetailsScreen', { petId: featuredPet.id })}
          onSayHi={() => featuredPet && handleSayHi(featuredPet)}
          onPressLostFound={() => navigation.navigate('LostAndFoundScreen')}
        />
      </View>

      {/* category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20, paddingLeft: 20 }}>
        {CATEGORY_OPTIONS.map((opt) => {
          const active = selectedCategory === opt.key;
          const count = counts[opt.key] ?? 0;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => onSelectCategory(opt.key)}
              style={[
                styles.chip, { borderColor: colors.border },
                active && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? '#FFF' : colors.textPrimary }]}>{opt.key}</Text>
              <Text style={[styles.chipCount, { color: active ? '#FFF' : colors.textSecondary }]}> {count}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ width: 20 }} />
      </ScrollView>

      {/* near you header */}
      <Text style={[styles.nearYou, { color: colors.textPrimary, paddingHorizontal: 20, marginTop: 20, marginBottom: 12 }]}>Near you</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredPets}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16, gap: 12 }}
        ListHeaderComponent={ListHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Ionicons name="paw-outline" size={56} color={colors.border} />
            <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', marginTop: 12, textAlign: 'center' }}>
              {pets.length === 0 ? 'No pets available right now. Check back soon!' : 'No pets match your filters.'}
            </Text>
            {pets.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); setSelectedCategory('All'); setFilters({}); AsyncStorage.removeItem(FILTERS_KEY); }} style={{ marginTop: 12 }}>
                <Text style={{ color: colors.primary, fontFamily: 'DMSans_700Bold' }}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <PetCard pet={item} onPress={() => navigation.navigate('PetDetailsScreen', { petId: item.id })} />
        )}
        ListFooterComponent={
          // [COMMUNITY-FEED] community section below adoption grid
          communityPosts.length > 0 ? (
            <View style={[styles.communitySection, { backgroundColor: colors.background }]}>
              <Text style={[styles.communityHeader, { color: colors.textPrimary }]}>Community</Text>
              {communityPosts.map((post) => (
                <GeneralPostCard key={post.id} item={post} colors={colors} />
              ))}
              <View style={{ height: 110 }} />
            </View>
          ) : (
            <View style={{ height: 110 }} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  greetSmall: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  greetBig: { fontSize: 26, fontFamily: 'DMSerifDisplay_400Regular' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#FFF', fontFamily: 'DMSans_700Bold', fontSize: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  searchPill: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 22, paddingHorizontal: 14, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  filterBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  chipCount: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  nearYou: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular' },
  communitySection: { marginTop: 24 },
  communityHeader: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', paddingHorizontal: 20, marginBottom: 12 },
});
