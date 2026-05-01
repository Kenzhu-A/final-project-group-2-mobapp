// [PET-EDIT] populated listings with Edit + Delete actions
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function MyListingsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          const userId = await AsyncStorage.getItem('userId');
          if (!userId) return;
          const data = await api.getMyPets(userId);
          setListings(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
      })();
    }, [])
  );

  const statusColor = (s: string) =>
    s === 'available' ? '#22C55E' : s === 'adopted' ? '#9CA3AF' : '#F59E0B';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Listings</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : listings.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="list-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No listings yet.</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Pets you list for adoption will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="paw" size={24} color="#FFF" />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.pet_name}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.category} • {item.age} {item.age === 1 ? 'yr' : 'yrs'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
                  <Text style={{ color: statusColor(item.status), fontFamily: 'DMSans_700Bold', fontSize: 12 }}>
                    {(item.status || 'available').replace(/^./, (c: string) => c.toUpperCase())}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => navigation.navigate('EditPetPostScreen', { pet: item })} style={styles.actionBtn}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('DeletePetPostScreen', { pet: item })} style={styles.actionBtn}>
                <Ionicons name="trash" size={20} color="#B23A3A" />
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontFamily: 'DMSerifDisplay_400Regular', marginTop: 16 },
  emptySub: { fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  thumb: { width: 56, height: 56, borderRadius: 8, resizeMode: 'cover' },
  name: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  meta: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  actionBtn: { padding: 8 },
});
