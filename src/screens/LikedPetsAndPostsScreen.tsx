// [LIKED-POSTS] unified liked content — two tabs: Pets / Posts
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import PetCard from '../components/PetCard';
import GeneralPostCard from '../components/GeneralPostCard';

type Tab = 'pets' | 'posts';

export default function LikedPetsAndPostsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('pets');
  const [likedPets, setLikedPets] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const uid = await AsyncStorage.getItem('userId');
      if (!uid) return;

      const [storedPets, storedPosts, allPets, allPosts] = await Promise.all([
        AsyncStorage.getItem(`${uid}_likedPets`),
        AsyncStorage.getItem(`${uid}_likedPosts`),
        api.getAllPets(),
        api.getGeneralPosts(),
      ]);

      const petIds: string[] = storedPets ? JSON.parse(storedPets) : [];
      const postIds: string[] = storedPosts ? JSON.parse(storedPosts) : [];

      setLikedPets((allPets || []).filter((p: any) => petIds.includes(p.id)));
      setLikedPosts((allPosts || []).filter((p: any) => postIds.includes(p.id)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Liked Posts</Text>
      </View>

      {/* tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['pets', 'posts'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={styles.tab} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, { color: activeTab === t ? colors.primary : colors.textSecondary }]}>
              {t === 'pets' ? `Pets (${likedPets.length})` : `Posts (${likedPosts.length})`}
            </Text>
            {activeTab === t && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : activeTab === 'pets' ? (
        <FlatList
          data={likedPets}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 110, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No liked pets yet.</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Tap the heart on any pet card to like it.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PetCard pet={item} onPress={() => navigation.navigate('PetDetailsScreen', { petId: item.id })} />
          )}
        />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {likedPosts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No liked posts yet.</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Tap the heart on any community post to like it.</Text>
            </View>
          ) : (
            likedPosts.map((post) => (
              <GeneralPostCard key={post.id} item={post} colors={colors} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabText: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  tabUnderline: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, borderRadius: 1 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 12 },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 6, textAlign: 'center' },
});
