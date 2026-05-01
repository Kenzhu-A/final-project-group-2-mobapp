// [PUSH-NOTIF] Notifications screen — AsyncStorage-backed, supports delete + multi-select
import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const NOTIF_KEY = 'snoutscout_notifications';
const isMessageNotif = (n: AppNotification) => n.type === 'new_message' || n.icon === 'chatbubble-outline';
const isAnnouncementNotif = (n: AppNotification) => n.type === 'announcement' || n.icon === 'megaphone-outline';

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;         // ISO string stored; displayed relative or formatted
  icon: string;         // Ionicons name
  read: boolean;
  type?: 'new_message' | 'announcement' | 'system';
  source?: string;      // e.g., "Administrator", "System", sender name
  senderId?: string;
  senderName?: string;
}

// [PUSH-NOTIF] helper — write a new notification from anywhere via AsyncStorage
// dedupKey: if supplied, the notification is skipped when one with that id already exists
export async function pushLocalNotification(
  notif: Omit<AppNotification, 'id' | 'read'>,
  dedupKey?: string,
) {
  const raw = await AsyncStorage.getItem(NOTIF_KEY);
  const list: AppNotification[] = raw ? JSON.parse(raw) : [];
  if (dedupKey && list.some((n) => n.id === dedupKey)) return;
  const id = dedupKey || `${Date.now()}-${Math.random()}`;
  const next = [{ ...notif, id, read: false }, ...list];
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ChatNotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allNotifs = notifications
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const [latest, ...rest] = allNotifs;
  const listItems = useMemo(() => {
    const today: Array<{ type: 'item'; item: AppNotification } | { type: 'section'; label: string }> = [];
    const earlier: Array<{ type: 'item'; item: AppNotification } | { type: 'section'; label: string }> = [];
    rest.forEach((item) => {
      if (new Date(item.time).toDateString() === new Date().toDateString()) {
        today.push({ type: 'item', item });
      } else {
        earlier.push({ type: 'item', item });
      }
    });
    const result: Array<{ type: 'item'; item: AppNotification } | { type: 'section'; label: string }> = [];
    if (today.length > 0) result.push({ type: 'section', label: 'Today' }, ...today);
    if (earlier.length > 0) result.push({ type: 'section', label: 'Earlier' }, ...earlier);
    return result;
  }, [rest]);

  // [PUSH-NOTIF] load from AsyncStorage; seed welcome notif on first open
  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(NOTIF_KEY);
    let list: AppNotification[] = raw ? JSON.parse(raw) : [];

    if (!raw) {
      list = [
        {
          id: 'welcome',
          title: 'Welcome to SnoutScout!',
          desc: 'Start browsing pets or create your first post.',
          time: new Date().toISOString(),
          icon: 'paw',
          read: true,
        },
      ];
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(list));
    }

    // Auto-read announcements when opening notifications screen
    const updated = list.map((n) => (isAnnouncementNotif(n) ? { ...n, read: true } : n));
    setNotifications(updated);
    AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // [PUSH-NOTIF] delete single notification
  const deleteOne = useCallback(async (id: string) => {
    const next = notifications.filter((n) => n.id !== id);
    setNotifications(next);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  }, [notifications]);

  // [PUSH-NOTIF] delete selected notifications
  const deleteSelected = useCallback(async () => {
    const next = notifications.filter((n) => !selected.has(n.id));
    setNotifications(next);
    setSelected(new Set());
    setSelectMode(false);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  }, [notifications, selected]);

  // [PUSH-NOTIF] clear all notifications
  const clearAll = () => {
    Alert.alert('Clear all notifications?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all', style: 'destructive', onPress: async () => {
          setNotifications([]);
          setSelected(new Set());
          setSelectMode(false);
          await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify([]));
        },
      },
    ]);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enterSelectMode = (id: string) => {
    setSelectMode(true);
    setSelected(new Set([id]));
  };

  const cancelSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const allSelected = allNotifs.length > 0 && selected.size === allNotifs.length;
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allNotifs.map((n) => n.id)));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {selectMode ? (
          <>
            <Pressable onPress={cancelSelect} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {`${selected.size} selected`}selected
            </Text>
            <Pressable onPress={toggleSelectAll} style={{ padding: 4 }}>
              <Ionicons
                name={allSelected ? 'checkbox' : 'checkbox-outline'}
                size={22}
                color={colors.primary}
              />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
            {allNotifs.length > 0 ? (
              <View style={styles.headerActions}>
                <Pressable onPress={clearAll} style={{ padding: 4 }}>
                  <Text style={[styles.clearText, { color: colors.primary }]}>Clear all</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </>
        )}
      </View>

      {/* [PUSH-NOTIF] multi-select delete bar */}
      {selectMode && selected.size > 0 && (
        <View style={[styles.deleteBar, { backgroundColor: '#FDECEA', borderTopColor: '#F5C6C6' }]}>
          <Pressable style={styles.deleteBarBtn} onPress={deleteSelected}>
            <Ionicons name="trash-outline" size={18} color="#D32F2F" />
            <Text style={styles.deleteBarText}>{`Delete ${selected.size} notification${selected.size > 1 ? 's' : ''}`}</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={listItems}
        keyExtractor={(item, index) => (item.type === 'section' ? `section_${item.label}_${index}` : item.item.id)}
        contentContainerStyle={[
          { padding: 16, paddingBottom: 110 },
          allNotifs.length === 0 && styles.emptyContainer,
        ]}
        ListEmptyComponent={
          // If we have a "Latest" header card, the list itself can be empty (only 1 notif total).
          // In that case, don't show the empty-state UI underneath.
          latest ? null : (
            <View style={styles.emptyInner}>
              <Ionicons name="notifications-off-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                You're all caught up! Check back later.
              </Text>
            </View>
          )
        }
        ListHeaderComponent={
          latest ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Latest</Text>
              <Pressable
                onPress={() =>
                  latest.senderId
                    ? navigation.navigate('ChatScreen', {
                        receiverId: latest.senderId,
                        receiverName: latest.senderName || latest.title,
                      })
                    : null
                }
                style={[
                  styles.latestCard,
                  { backgroundColor: colors.surface, borderColor: colors.primary + '66' },
                ]}
              >
                <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name={latest.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{latest.title}</Text>
                  <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>{latest.desc}</Text>
                </View>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(latest.time)}</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                {item.label}
              </Text>
            );
          }

          const notif = item.item;
          const isSelected = selected.has(notif.id);
          return (
            <Pressable
              onPress={() => {
                if (selectMode) {
                  toggleSelect(notif.id);
                } else if (notif.senderId) {
                  navigation.navigate('ChatScreen', {
                    receiverId: notif.senderId,
                    receiverName: notif.senderName || notif.title,
                  });
                }
              }}
              onLongPress={() => !selectMode && enterSelectMode(notif.id)}
              style={[
                styles.card,
                {
                  backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              {/* select checkbox */}
              {selectMode && (
                <View style={styles.checkbox}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                </View>
              )}

              <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={notif.icon as any} size={24} color={colors.primary} />
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{notif.title}</Text>
                <Text style={[styles.notifDesc, { color: colors.textSecondary }]} numberOfLines={2}>{notif.desc}</Text>
                <View style={styles.footerRow}>
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(notif.time)}</Text>
                  {notif.source && (
                    <Text style={[styles.sourceText, { color: colors.textSecondary }]}>{notif.source}</Text>
                  )}
                </View>
              </View>

              {/* [PUSH-NOTIF] swipe-style delete button (shown when not in select mode) */}
              {!selectMode && (
                <Pressable
                  onPress={() => deleteOne(notif.id)}
                  hitSlop={8}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  clearText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontFamily: 'DMSans_700Bold', marginBottom: 8, marginLeft: 2, opacity: 0.8 },
  latestCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1 },
  deleteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  deleteBarBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBarText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#D32F2F' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  checkbox: { marginRight: 12 },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  textContainer: { flex: 1 },
  notifTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  notifDesc: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18, marginBottom: 6 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: 11, fontFamily: 'DMSans_400Regular', opacity: 0.7 },
  sourceText: { fontSize: 11, fontFamily: 'DMSans_700Bold', opacity: 0.6 },
  deleteBtn: { paddingLeft: 12, paddingVertical: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyInner: { alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 16 },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 6, textAlign: 'center' },
});
