// [ADMIN-MESSAGES] user list for message moderation
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function AdminMessagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const adminId = await AsyncStorage.getItem('userId');
      if (!adminId) return;
      const data = await api.getUsers(adminId);
      setUsers(data || []);
    } catch (e) {
      console.error('[ADMIN-MESSAGES] load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Messages</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Inspect and moderate user conversations
      </Text>

      {/* search */}
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="people-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('AdminUserConversationsScreen', { userId: item.id, userName: item.full_name || item.email })}
          >
            <Image
              source={item.avatar_url ? { uri: item.avatar_url } : require('../../../assets/adaptive-icon.png')}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.full_name || 'Unknown User'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
            <View style={[styles.inspectBtn, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.inspectText, { color: colors.primary }]}>Inspect</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  title: { fontSize: 26, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginBottom: 16 },
  searchPill: {
    flexDirection: 'row', alignItems: 'center', height: 42,
    borderRadius: 21, paddingHorizontal: 14, borderWidth: 1, gap: 8, marginBottom: 12,
  },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  userEmail: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  inspectBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 4 },
  inspectText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  emptyText: { fontFamily: 'DMSans_400Regular', marginTop: 10, fontSize: 14 },
});
