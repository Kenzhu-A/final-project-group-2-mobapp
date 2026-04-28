import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function AdminBottomNavBar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const renderIcon = (tab: string, iconName: any, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => setActiveTab(tab)} 
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isActive ? iconName : `${iconName}-outline`} 
          size={24} 
          color={isActive ? colors.primary : colors.textSecondary} 
        />
        <Text style={[styles.navText, { color: isActive ? colors.primary : colors.textSecondary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface,
        bottom: Math.max(insets.bottom, 15) + 10, 
      } 
    ]}>
      {renderIcon('dashboard', 'grid', 'Dashboard')}
      {renderIcon('announcements', 'megaphone', 'Announce')}
      {renderIcon('profile', 'person', 'Profile')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    position: 'absolute', 
    left: 20, 
    right: 20, 
    height: 70, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    borderRadius: 35, 
    paddingHorizontal: 10, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 10 
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  navText: { fontSize: 10, fontFamily: 'DMSans_700Bold', marginTop: 4 },
});