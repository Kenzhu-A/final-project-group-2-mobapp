// [DASHBOARD-REDESIGN] public profile of another user — accessed from PetDetailsScreen owner card
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import PetCard from '../components/PetCard';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_H = 130;
const AVATAR_SIZE = 80;

const CATEGORY_OPTIONS = [
  { key: 'All', dbValue: null },
  { key: 'Dogs', dbValue: 'Dog' },
  { key: 'Cats', dbValue: 'Cat' },
  { key: 'Birds', dbValue: 'Bird' },
  { key: 'Rabbits', dbValue: 'Rabbit' },
  { key: 'Other', dbValue: 'Other' },
];

export default function ViewUserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { colors } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const [userData, petData] = await Promise.all([
          api.getUserProfile(userId),
          api.getMyPets(userId),
        ]);
        setUser(userData);
        setPets(petData || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [userId]);

  const filteredPets = pets.filter((p) => {
    if (selectedCategory === 'All') return true;
    const opt = CATEGORY_OPTIONS.find((o) => o.key === selectedCategory);
    return opt?.dbValue ? p.category === opt.dbValue : true;
  });

  const adoptedCount = pets.filter((p) => p.status === 'adopted').length;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* back button overlaid on banner */}
      <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </Pressable>
      <Text style={styles.screenLabel}>View User Profile</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: colors.accent }]} />

        {/* Avatar overlapping banner */}
        <View style={styles.avatarWrap}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={[styles.avatar, { borderColor: colors.surface }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
              <Ionicons name="person" size={34} color="#FFF" />
            </View>
          )}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.full_name || 'Anonymous'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>

          {/* stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{pets.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Listed</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{adoptedCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Adopted</Text>
            </View>
          </View>

          {/* listed pets section */}
          {pets.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Listed Pets</Text>

              {/* category chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {CATEGORY_OPTIONS.filter((opt) =>
                  opt.key === 'All' || pets.some((p) => p.category === opt.dbValue)
                ).map((opt) => {
                  const active = selectedCategory === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setSelectedCategory(opt.key)}
                      style={[
                        styles.chip,
                        { borderColor: colors.border },
                        active && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? '#FFF' : colors.textPrimary }]}>{opt.key}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* 2-column pet grid */}
              <View style={styles.grid}>
                {filteredPets.map((pet, i) => (
                  <View key={pet.id} style={styles.gridItem}>
                    <PetCard
                      pet={pet}
                      onPress={() => navigation.navigate('PetDetailsScreen', { petId: pet.id })}
                    />
                  </View>
                ))}
              </View>
            </>
          )}

          {pets.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 32 }}>
              <Ionicons name="paw-outline" size={48} color={colors.border} />
              <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', marginTop: 10 }}>
                No pets listed yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 52, left: 16, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  screenLabel: { position: 'absolute', top: 58, alignSelf: 'center', zIndex: 10, color: '#FFF', fontFamily: 'DMSans_700Bold', fontSize: 14 },
  banner: { height: BANNER_H, width: SCREEN_W },
  avatarWrap: { alignItems: 'center', marginTop: -(AVATAR_SIZE / 2) },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 4, resizeMode: 'cover' },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  infoSection: { paddingHorizontal: 20, paddingTop: 12 },
  name: { fontSize: 24, fontFamily: 'DMSerifDisplay_400Regular', textAlign: 'center', marginTop: 4 },
  email: { fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 20, marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  statNum: { fontSize: 22, fontFamily: 'DMSans_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%' },
});
