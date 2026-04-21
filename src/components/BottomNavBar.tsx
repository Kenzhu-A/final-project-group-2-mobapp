import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <-- IMPORT THIS
import { theme } from '../theme';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  { id: 'search', icon: 'search-outline', activeIcon: 'search', label: 'Search' },
  { id: 'add', icon: 'add-circle-outline', activeIcon: 'add-circle', label: 'Add', isCenter: true },
  { id: 'messages', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', label: 'Chat' },
  { id: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
];

export default function BottomNavBar({ activeTab, setActiveTab }: Props) {
  const insets = useSafeAreaInsets(); // <-- GRAB SYSTEM INSETS

  return (
    <View style={[
      styles.container, 
      // Add exact system padding to prevent overlap with Android/iOS gesture bars
      { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 15) } 
    ]}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.navItem, item.isCenter && styles.centerItem]} 
            onPress={() => setActiveTab(item.id)}
            activeOpacity={0.7}
          >
            {item.isCenter ? (
              <View style={styles.centerIconWrapper}>
                <Ionicons name={isActive ? item.activeIcon as any : item.icon as any} size={32} color="#FFF" />
              </View>
            ) : (
              <>
                <Ionicons 
                  name={isActive ? item.activeIcon as any : item.icon as any} 
                  size={24} 
                  color={isActive ? theme.colors.primary : theme.colors.textLight} 
                />
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navItem: { alignItems: 'center', flex: 1 },
  centerItem: { marginBottom: 5 },
  centerIconWrapper: {
    backgroundColor: theme.colors.primary,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8
  },
  navText: { fontSize: 11, color: theme.colors.textLight, marginTop: 4, fontFamily: theme.typography.bodyFontBold },
  navTextActive: { color: theme.colors.primary },
});