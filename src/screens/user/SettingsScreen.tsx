import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { registerForPushNotificationsAsync } from '../../utils/notifications';
import { api } from '../../services/api';

export default function SettingsScreen({ navigation }: any) {
  const { isDarkMode, toggleTheme, colors } = useTheme(); 
  const [pushEnabled, setPushEnabled] = useState(false);

  const handleTogglePush = async (value: boolean) => {
    setPushEnabled(value);
    if (value === true) {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        Alert.alert("Success", "Push Notifications have been enabled for this device.");
      } else {
        setPushEnabled(false);
      }
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account and all associated posts/messages? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              if (userId) await api.deleteAccount(userId);
              await AsyncStorage.removeItem('userId');
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e) { 
              Alert.alert("Error", "Could not delete account."); 
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Settings</Text>

        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('EditProfile')}>
            <View style={styles.menuLeft}>
              <Ionicons name="person-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('ChangePassword')}>
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Push Notifications</Text>
            </View>
            <Switch value={pushEnabled} onValueChange={handleTogglePush} trackColor={{ false: '#767577', true: colors.primary }} thumbColor={'#FFF'} />
          </View>

          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <View style={styles.menuLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.textPrimary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: colors.primary }} thumbColor={'#FFF'} />
          </View>
        </View>

        {/* DELETE ACCOUNT BUTTON */}
        <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 16, marginLeft: 4 },
  menuCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 12 },
  menuText: { fontSize: 16, fontFamily: 'DMSans_400Regular' },
  deleteButton: { marginTop: 32, padding: 16, backgroundColor: '#FDECEA', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F5C6C6' },
  deleteButtonText: { color: '#D32F2F', fontFamily: 'DMSans_700Bold', fontSize: 16 },
});