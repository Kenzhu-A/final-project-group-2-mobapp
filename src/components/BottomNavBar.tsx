import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// [DASHBOARD-REDESIGN] tab order: Home / Message / + / Saved / Profile
const NAV_ITEMS = [
  { id: 'home',     icon: 'home-outline',       activeIcon: 'home',       label: 'Home' },
  { id: 'messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble', label: 'Message' },
  { id: 'add',      icon: 'add',                activeIcon: 'add',        label: 'Add', isCenter: true },
  { id: 'saved',    icon: 'bookmark-outline',   activeIcon: 'bookmark',   label: 'Saved' },
  { id: 'profile',  icon: 'person-outline',     activeIcon: 'person',     label: 'Profile' },
];

export default function BottomNavBar({ activeTab, setActiveTab }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, bottom: insets.bottom + 4 }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <Pressable key={item.id} style={styles.navItem} onPress={() => setActiveTab(item.id)}>
            {item.isCenter ? (
              <View style={styles.centerIconWrapper}>
                <Ionicons name={item.activeIcon as any} size={32} color="#FFF" />
              </View>
            ) : (
              <View style={[
                styles.iconPill,
                isActive && { backgroundColor: colors.primary + '22' },
              ]}>
                <Ionicons
                  name={isActive ? item.activeIcon as any : item.icon as any}
                  size={22}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.navText, { color: isActive ? colors.primary : colors.textSecondary }]}>
                  {item.label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: 20, right: 20, height: 68,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 34, paddingHorizontal: 8,
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12, shadowRadius: 10,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  standardIconWrapper: { alignItems: 'center', justifyContent: 'center' },
  // pill-shaped highlight — wraps both icon and text
  iconPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  centerIconWrapper: {
    backgroundColor: '#D85A30', width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    top: -28, position: 'absolute',
    shadowColor: '#D85A30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 8,
  },
  navText: { fontSize: 10, fontFamily: 'DMSans_700Bold' },});
