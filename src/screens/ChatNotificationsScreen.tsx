// [PUSH-NOTIF] Notifications screen — AsyncStorage-backed, supports delete + multi-select
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const NOTIF_KEY = 'snoutscout_notifications';

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;         // ISO string stored; displayed relative or formatted
  icon: string;         // Ionicons name
  read: boolean;
}

// [PUSH-NOTIF] helper — write a new notification from anywhere via AsyncStorage
export async function pushLocalNotification(notif: Omit<AppNotification, 'id' | 'read'>) {
  const raw = await AsyncStorage.getItem(NOTIF_KEY);
  const list: AppNotification[] = raw ? JSON.parse(raw) : [];
  const next = [{ ...notif, id: `${Date.now()}-${Math.random()}`, read: false }, ...list];
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

  // [PUSH-NOTIF] load from AsyncStorage; seed welcome notif on first open
  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(NOTIF_KEY);
    if (raw) {
      setNotifications(JSON.parse(raw));
    } else {
      const seed: AppNotification[] = [
        {
          id: 'welcome',
          title: 'Welcome to SnoutScout!',
          desc: 'Start browsing pets or create your first post.',
          time: new Date().toISOString(),
          icon: 'paw',
          read: false,
        },
      ];
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(seed));
      setNotifications(seed);
    }
    // mark all as read
    const updated: AppNotification[] = raw
      ? JSON.parse(raw).map((n: AppNotification) => ({ ...n, read: true }))
      : [];
    if (updated.length) AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated)).catch(() => {});
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

  const allSelected = notifications.length > 0 && selected.size === notifications.length;
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(notifications.map((n) => n.id)));
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
              {selected.size} selected
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
            {notifications.length > 0 ? (
              <Pressable onPress={clearAll} style={{ padding: 4 }}>
                <Text style={[styles.clearText, { color: colors.primary }]}>Clear all</Text>
              </Pressable>
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
            <Text style={styles.deleteBarText}>Delete {selected.size} notification{selected.size > 1 ? 's' : ''}</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          { padding: 16, paddingBottom: 110 },
          notifications.length === 0 && styles.emptyContainer,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <Ionicons name="notifications-off-outline" size={56} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              You're all caught up! Check back later.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <Pressable
              onPress={() => selectMode ? toggleSelect(item.id) : null}
              onLongPress={() => !selectMode && enterSelectMode(item.id)}
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
                <Ionicons name={item.icon as any} size={24} color={colors.primary} />
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(item.time)}</Text>
              </View>

              {/* [PUSH-NOTIF] swipe-style delete button (shown when not in select mode) */}
              {!selectMode && (
                <Pressable
                  onPress={() => deleteOne(item.id)}
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
  notifDesc: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18 },
  timeText: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 6, opacity: 0.7 },
  deleteBtn: { paddingLeft: 12, paddingVertical: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyInner: { alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, marginTop: 16 },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 6, textAlign: 'center' },
});
