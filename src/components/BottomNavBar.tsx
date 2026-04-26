import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

// 1. IMPORT THE GLOBAL THEME
import { useTheme } from '../context/ThemeContext'; 

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // NOTE: We removed isDarkMode from props because the context handles it now!
}

const NAV_ITEMS = [
  { id: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  { id: 'messages', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', label: 'Chat' },
  { id: 'add', icon: 'add-circle-outline', activeIcon: 'add-circle', label: 'Add', isCenter: true },
  { id: 'saved', icon: 'bookmark-outline', activeIcon: 'bookmark', label: 'Saved' },
  { id: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
];

export default function BottomNavBar({ activeTab, setActiveTab }: Props) {
  const insets = useSafeAreaInsets(); 
  
  // 2. CALL THE THEME CONTEXT
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface, // Automatically switches dark/light
        bottom: Math.max(insets.bottom, 15) + 10, 
      } 
    ]}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <TouchableOpacity key={item.id} style={styles.navItem} onPress={() => setActiveTab(item.id)} activeOpacity={0.8}>
            {item.isCenter ? (
              <View style={styles.centerIconWrapper}>
                <Ionicons name={isActive ? item.activeIcon as any : item.icon as any} size={32} color="#FFF" />
              </View>
            ) : (
              <View style={styles.standardIconWrapper}>
                <Ionicons 
                  name={isActive ? item.activeIcon as any : item.icon as any} 
                  size={24} 
                  color={isActive ? colors.primary : colors.textSecondary} 
                />
                <Text style={[styles.navText, { color: isActive ? colors.primary : colors.textSecondary }]}>
                  {item.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ... Keep your exact same styles down here ...
const styles = StyleSheet.create({
  container: { position: 'absolute', left: 20, right: 20, height: 70, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 35, paddingHorizontal: 10, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  standardIconWrapper: { alignItems: 'center', justifyContent: 'center' },
  centerIconWrapper: { backgroundColor: '#F26419', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', top: -20, position: 'absolute', shadowColor: '#F26419', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 8 },
  navText: { fontSize: 10, marginTop: 4, fontWeight: 'bold' },
});