// [ADMIN] admin-specific profile — simplified, no user-facing tabs
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

interface Props {
  navigation: any;
  handleSignOut: () => void;
}

export default function AdminProfileScreen({ navigation, handleSignOut }: Props) {
  const { colors } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            const data = await api.getUserProfile(userId);
            if (active) setUser(data);
          }
        } catch (e) { console.error('[ADMIN-PROFILE] load failed', e); }
        finally { if (active) setLoading(false); }
      })();
      return () => { active = false; };
    }, [])
  );

  const handleEditAvatar = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert('Permission Required', 'Allow photo library access to upload an avatar.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) uploadAvatar(result.assets[0].uri);
  };

  const uploadAvatar = async (uri: string) => {
    setUploading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image';
      const formData = new FormData();
      formData.append('avatar', { uri, name: filename, type } as any);
      formData.append('userId', userId);
      const newUrl = await api.uploadAvatar(formData);
      setUser((u: any) => ({ ...u, avatar_url: newUrl }));
    } catch (e: any) { Alert.alert('Upload Failed', e.message); }
    finally { setUploading(false); }
  };

  if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />;

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>

      {/* header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        {/* admin badge */}
        <View style={[styles.adminBadge, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={[styles.adminBadgeText, { color: colors.primary }]}>Admin</Text>
        </View>
      </View>

      {/* avatar */}
      <View style={styles.avatarContainer}>
        {uploading ? (
          <View style={[styles.avatarImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <Image
            source={user?.avatar_url ? { uri: user.avatar_url } : require('../../../assets/adaptive-icon.png')}
            style={[styles.avatarImage, { borderColor: colors.primary }]}
          />
        )}
        <Pressable style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]} onPress={handleEditAvatar}>
          <Ionicons name="pencil" size={16} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.full_name || 'Admin User'}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      {/* menu — admin only has Settings */}
      <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('SettingsScreen')}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* logout */}
      <Pressable
        style={styles.logoutButton}
        onPress={() =>
          Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: handleSignOut },
          ])
        }
      >
        <Ionicons name="log-out-outline" size={22} color="#D32F2F" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 8 },
  headerTitle: { fontSize: 24, fontFamily: 'DMSerifDisplay_400Regular' },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  adminBadgeText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  avatarContainer: { alignSelf: 'center', position: 'relative', marginBottom: 16 },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  userInfo: { alignItems: 'center', marginBottom: 32 },
  userName: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 4 },
  userEmail: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuText: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: '#FDECEA', borderWidth: 1, borderColor: '#F5C6C6' },
  logoutText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#D32F2F' },
});
