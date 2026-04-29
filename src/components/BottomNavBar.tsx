import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTheme } from '../context/ThemeContext'; 

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// [DASHBOARD-REDESIGN] new tab order: Home / Message / + / Saved / Profile
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
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface,
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
                <Text style={[styles.navText, { color: isActive ? colors.primary : colors.textSecondary }]}>{item.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 20, right: 20, height: 70, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 35, paddingHorizontal: 10, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '28%' },
  standardIconWrapper: { alignItems: 'center', justifyContent: 'center' },
  centerIconWrapper: { backgroundColor: '#D85A30', width: 55, height: 55, borderRadius: 40, justifyContent: 'center', alignItems: 'center', top: -20, position: 'absolute', shadowColor: '#F26419', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 8 },
  navText: { fontSize: 10, marginTop: 4, fontFamily: 'DMSans_700Bold' },
});