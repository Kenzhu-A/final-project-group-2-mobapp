// [ADMIN-MESSAGES] conversations list for a specific user — admin can delete threads
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Image, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AdminUserConversationsScreen({ route, navigation }: any) {
  const { userId, userName } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      // [ADMIN-CONVO-INSPECT] Use admin endpoint to inspect user conversations
      const data = await api.getUserConversations(userId);
      setConversations(data || []);
    } catch (e) {
      console.error('[ADMIN-MESSAGES] conversations load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  // [ADMIN-MESSAGES] delete an entire conversation thread
  const handleDeleteConversation = (partnerId: string, partnerName: string) => {
    Alert.alert(
      'Delete Conversation',
      `Permanently delete all messages between ${userName} and ${partnerName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              // [USER-REPORT-MODERATION] Admin delete removes the conversation for both participants.
              await api.deleteConversationForAll(userId, partnerId);
              setConversations((prev) => prev.filter((c) => c.partnerId !== partnerId));
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not delete conversation.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.partnerId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No conversations.</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                This user has not sent or received any messages.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.convCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* partner info row */}
              <View style={styles.convHeader}>
                <Image
                  source={item.partnerAvatar ? { uri: item.partnerAvatar } : require('../../../assets/adaptive-icon.png')}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.partnerName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.partnerName}
                  </Text>
                  <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.latestMessage}
                  </Text>
                </View>
                <Text style={[styles.time, { color: colors.textSecondary }]}>{timeAgo(item.createdAt)}</Text>
              </View>

              {/* [ADMIN-MESSAGES] regulatory action buttons */}
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, { borderColor: colors.border, flex: 1 }]}
                  onPress={() => navigation.navigate('AdminMessageThreadScreen', {
                    user1: userId,
                    user1Name: userName,
                    user2: item.partnerId,
                    user2Name: item.partnerName,
                  })}
                >
                  <Ionicons name="eye-outline" size={15} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>View Thread</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, { borderColor: '#D32F2F', flex: 1 }]}
                  onPress={() => handleDeleteConversation(item.partnerId, item.partnerName)}
                >
                  <Ionicons name="trash-outline" size={15} color="#D32F2F" />
                  <Text style={[styles.actionText, { color: '#D32F2F' }]}>Delete Thread</Text>
                </Pressable>
              </View>
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
  convCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  convHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  partnerName: { fontSize: 15, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  preview: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
  time: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6, borderRightWidth: 0,
  },
  actionText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 12 },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 6, textAlign: 'center' },
});
