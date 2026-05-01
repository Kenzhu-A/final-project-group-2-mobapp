// [ADMIN] all-pets management — admin can view, edit, and delete any pet listing
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

type StatusFilter = 'All' | 'Available' | 'Adopted';

export default function AdminPetsScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // [ADMIN] allow dashboard card to open with a pre-selected filter
  const initialFilter: StatusFilter = route?.params?.filter ?? 'All';
  const [filter, setFilter] = useState<StatusFilter>(initialFilter);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      // [ADMIN-PETS] use admin endpoint — returns all pets including adopted ones
      // (user-facing getAllPets filters to status='available' only)
      const data = await api.getAdminAllPets();
      setPets(data || []);
    } catch (e) { console.error('[ADMIN-PETS] load failed', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (pet: any) => {
    Alert.alert(
      'Delete Pet Listing',
      `Permanently remove "${pet.pet_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePetPost(pet.id);
              setPets((prev) => prev.filter((p) => p.id !== pet.id));
            } catch (e: any) { Alert.alert('Error', e.message || 'Could not delete listing.'); }
          },
        },
      ],
    );
  };

  const countFor = (f: StatusFilter) => {
    if (f === 'All') return pets.length;
    const key = f.toLowerCase();
    return pets.filter((p) => (p.status || 'available') === key).length;
  };

  const displayed = pets.filter((p) => {
    const matchesFilter =
      filter === 'All' || (p.status || 'available').toLowerCase() === filter.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (p.pet_name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.breed || '').toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const statusColor = (s: string) =>
    s === 'available' ? '#22C55E' : s === 'adopted' ? '#9CA3AF' : '#F59E0B';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Manage Pets</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{pets.length} total listings</Text>
        </View>
      </View>

      {/* search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={[styles.searchPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by name, category or breed"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* filter tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['All', 'Available', 'Adopted'] as StatusFilter[]).map((f) => {
          const active = filter === f;
          return (
            <Pressable key={f} style={styles.tab} onPress={() => setFilter(f)}>
              <Text style={[styles.tabText, { color: active ? colors.primary : colors.textSecondary }]}>
                {f} ({countFor(f)})
              </Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="paw-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No pets found.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = (item.status || 'available').toLowerCase();
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* thumbnail */}
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="paw" size={22} color="#FFF" />
                  </View>
                )}

                {/* info */}
                <View style={styles.info}>
                  <Text style={[styles.petName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.pet_name}
                  </Text>
                  <Text style={[styles.petMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.category}{item.breed ? ` • ${item.breed}` : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} />
                    <Text style={[styles.statusLabel, { color: statusColor(status) }]}>
                      {status.replace(/^./, (c: string) => c.toUpperCase())}
                    </Text>
                  </View>
                </View>

                {/* actions */}
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.primary + '18' }]}
                    onPress={() => navigation.navigate('EditPetPostScreen', { pet: item })}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#FDECEA', marginTop: 6 }]}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  searchPill: { flexDirection: 'row', alignItems: 'center', height: 42, borderRadius: 21, paddingHorizontal: 14, borderWidth: 1, gap: 8, marginBottom: 4 },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  tabUnderline: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, borderRadius: 1 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10 },
  thumb: { width: 60, height: 60, borderRadius: 10, marginRight: 12, resizeMode: 'cover' },
  info: { flex: 1 },
  petName: { fontSize: 15, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  petMeta: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusLabel: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  actions: { alignItems: 'center', marginLeft: 8 },
  actionBtn: { padding: 9, borderRadius: 10 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 12 },
});
