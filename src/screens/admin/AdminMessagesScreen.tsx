// [ADMIN-MESSAGES] conversation list for message moderation
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, Image, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function AdminMessagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const [conversations, setConversations] = useState<any[]>([]); // [ADMIN-CONVO-INSPECT]
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.getAdminConversations(); // [ADMIN-CONVO-INSPECT]
      setConversations(data || []);
    } catch (e) {
      console.error('[ADMIN-MESSAGES] load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.user1Name || '').toLowerCase().includes(q) ||
      (c.user2Name || '').toLowerCase().includes(q) ||
      (c.latestMessage || '').toLowerCase().includes(q)
    );
  }); // [ADMIN-CONVO-INSPECT]

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Messages</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>View all user conversations and perform moderation actions</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search conversations or messages"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={(
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={42} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No conversations found</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarStack}>
              <Image
                source={item.user1Avatar ? { uri: item.user1Avatar } : require('../../../assets/adaptive-icon.png')}
                style={[styles.avatar, styles.avatarFront]}
              />
              <Image
                source={item.user2Avatar ? { uri: item.user2Avatar } : require('../../../assets/adaptive-icon.png')}
                style={[styles.avatar, styles.avatarBack]}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.user1Name} & {item.user2Name}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.latestMessage || 'No message preview'} · {item.messageCount} message{item.messageCount === 1 ? '' : 's'}
              </Text>
            </View>
            <View style={styles.adminActionColumn}>
              <Pressable
                style={[styles.inspectBtn, { backgroundColor: colors.primary + '15' }]}
                onPress={() => navigation.navigate('AdminMessageThreadScreen', {
                  user1: item.user1Id,
                  user1Name: item.user1Name,
                  user2: item.user2Id,
                  user2Name: item.user2Name,
                })}
              >
                <Text style={[styles.inspectText, { color: colors.primary }]}>View</Text>
                <Ionicons name="eye-outline" size={14} color={colors.primary} />
              </Pressable>
              <Pressable
                style={[styles.inspectBtn, { backgroundColor: '#FDECEA' }]}
                onPress={() => {
                  Alert.alert(
                    'Delete Conversation',
                    `Delete all messages between ${item.user1Name} and ${item.user2Name}? This cannot be undone.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await api.deleteConversationForAll(item.user1Id, item.user2Id);
                            setConversations((prev) => prev.filter((c) => c.id !== item.id));
                          } catch (e: any) {
                            Alert.alert('Error', e.message || 'Could not delete conversation.');
                          }
                        },
                      },
                    ],
                  );
                }}
              >
                <Text style={[styles.inspectText, { color: '#D32F2F' }]}>Delete</Text>
                <Ionicons name="trash-outline" size={14} color="#D32F2F" />
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  title: { fontSize: 28, fontFamily: 'DMSans_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: 44, marginLeft: 8, fontFamily: 'DMSans_400Regular' },
  list: { padding: 20, paddingTop: 4 },
  userCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarStack: { width: 58, height: 44, marginRight: 12 },
  avatarFront: { position: 'absolute', left: 0, top: 0, borderWidth: 2, borderColor: '#FFF' },
  avatarBack: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2, borderColor: '#FFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  userEmail: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 3 },
  inspectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  inspectText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  adminActionColumn: { gap: 6, alignItems: 'flex-end' }, // [ADMIN-CONVO-INSPECT]
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 8, fontFamily: 'DMSans_400Regular' },
});
