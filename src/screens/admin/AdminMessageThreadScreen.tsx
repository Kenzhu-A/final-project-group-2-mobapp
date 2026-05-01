// [ADMIN-MESSAGES] full message thread — admin can delete individual messages
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminMessageThreadScreen({ route, navigation }: any) {
  const { user1, user1Name, user2, user2Name, reportId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      // [ADMIN-CONVO-INSPECT] Use admin endpoint to get full conversation
      const data = await api.getConversationMessages(user1, user2);
      setMessages(data || []);
    } catch (e) {
      console.error('[ADMIN-MESSAGES] thread load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user1, user2]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  // [ADMIN-MESSAGES] delete a single message
  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Remove this message permanently? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMessage(messageId);
              setMessages((prev) => prev.filter((m) => m.id !== messageId));
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not delete message.');
            }
          },
        },
      ],
    );
  };

  // [ADMIN-MESSAGES] delete entire conversation from the thread view
  const handleDeleteThread = () => {
    Alert.alert(
      'Delete Entire Thread',
      `Delete all messages between ${user1Name} and ${user2Name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All', style: 'destructive',
          onPress: async () => {
            try {
              // [USER-REPORT-MODERATION] Admin delete removes the conversation for both participants.
              await api.deleteConversationForAll(user1, user2);
              // [USER-REPORT-MODERATION] A reviewed user report is resolved once its conversation is deleted.
              if (reportId) await api.dismissReport(reportId);
              setMessages([]);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not delete thread.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {user1Name} & {user2Name}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* [ADMIN-MESSAGES] info banner */}
      <View style={[styles.banner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
        <Text style={[styles.bannerText, { color: colors.primary }]}>
          Admin view — review messages before clearing the conversation for both users.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No messages found for this conversation.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSenderUser1 = item.sender_id === user1;
            const senderName = isSenderUser1 ? user1Name : user2Name;
            return (
              <View style={[styles.messageRow, isSenderUser1 ? styles.rowRight : styles.rowLeft]}>
                {/* [ADMIN-MESSAGES] sender label above bubble */}
                <Text style={[styles.senderLabel, { color: colors.textSecondary }, isSenderUser1 && { textAlign: 'right' }]}>
                  {senderName}
                </Text>
                <View style={styles.bubbleRow}>
                  {!isSenderUser1 && (
                    <Pressable onPress={() => handleDeleteMessage(item.id)} style={styles.deleteBtn} hitSlop={8}>
                      <Ionicons name="trash-outline" size={15} color="#D32F2F" />
                    </Pressable>
                  )}
                  <View style={[
                    styles.bubble,
                    isSenderUser1
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  ]}>
                    <Text style={[styles.messageText, { color: isSenderUser1 ? '#FFF' : colors.textPrimary }]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.timeText, { color: isSenderUser1 ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
                      {formatTime(item.created_at)}
                    </Text>
                  </View>
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
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  headerSub: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  deleteThreadBtn: { flexDirection: 'row', alignItems: 'center', maxWidth: 150, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 4 },
  deleteThreadText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#D32F2F' },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  bannerText: { fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1 },
  messageRow: { marginBottom: 16 },
  rowLeft: { alignItems: 'flex-start' },
  rowRight: { alignItems: 'flex-end' },
  senderLabel: { fontSize: 11, fontFamily: 'DMSans_700Bold', marginBottom: 4, color: '#888' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  bubble: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  messageText: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
  timeText: { fontSize: 10, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 12 },
});
