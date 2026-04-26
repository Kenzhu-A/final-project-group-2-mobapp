import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // <-- IMPORT THEME CONTEXT
import { theme } from '../theme';

export default function SettingsScreen({ navigation }: any) {
  const { isDarkMode, toggleTheme, colors } = useTheme(); // <-- USE GLOBAL THEME
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Settings</Text>

        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {/* Navigate to Edit Profile */}
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="person-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Navigate to Change Password */}
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]} 
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Push Notifications */}
          <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Push Notifications</Text>
            </View>
            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: '#767577', true: colors.primary }} thumbColor={'#FFF'} />
          </View>

          {/* GLOBAL Dark Mode Toggle */}
          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <View style={styles.menuLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: colors.primary }} thumbColor={'#FFF'} />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.m, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: theme.typography.headingFont },
  content: { padding: theme.spacing.m },
  sectionTitle: { fontSize: 18, fontFamily: theme.typography.headingFont, marginBottom: theme.spacing.m, marginLeft: 4 },
  menuCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 12 },
  menuText: { fontSize: 16, fontFamily: theme.typography.bodyFont },
});