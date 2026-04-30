// [ADMIN] user management — view all users, delete accounts
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  Image, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUsersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.getAdminUsers();
      setUsers(data || []);
    } catch (e) { console.error('[ADMIN-USERS] load failed', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (user: any) => {
    Alert.alert(
      'Delete User',
      `Permanently delete ${user.full_name || user.email}'s account and all their data?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAdminUser(user.id);
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not delete user.');
            }
          },
        },
      ],
    );
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Manage Users</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{users.length} registered accounts</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <View style={[styles.searchPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by name or email"
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

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No users found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image
                source={item.avatar_url ? { uri: item.avatar_url } : require('../../../assets/adaptive-icon.png')}
                style={styles.avatar}
              />
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.full_name || 'Unknown User'}
                </Text>
                <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>{item.email}</Text>
                <Text style={[styles.joined, { color: colors.textSecondary }]}>
                  Joined {formatDate(item.created_at)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDelete(item)}
                style={[styles.deleteBtn, { backgroundColor: '#FDECEA' }]}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={18} color="#D32F2F" />
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
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  searchPill: {
    flexDirection: 'row', alignItems: 'center', height: 42,
    borderRadius: 21, paddingHorizontal: 14, borderWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  email: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 2 },
  joined: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  deleteBtn: { padding: 10, borderRadius: 10 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 12 },
});
