import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

interface ProfileProps {
  navigation: any;
  handleSignOut: () => void;
  setActiveTab?: (tab: string) => void; // [DASHBOARD-REDESIGN] for cross-tab navigation
}

export default function ProfileScreen({ navigation, handleSignOut, setActiveTab }: ProfileProps) {
  const { colors } = useTheme(); 

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadUser = async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            const userData = await api.getUserProfile(userId);
            if (isActive) setUser(userData);
          }
        } catch (error) {
          console.error(error);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      loadUser();
      return () => { isActive = false; };
    }, [])
  );

  const handleEditAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to allow camera roll access to upload an avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      uploadAvatarToSupabase(imageUri);
    }
  };

  const uploadAvatarToSupabase = async (uri: string) => {
    setUploading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('avatar', { uri, name: filename, type } as any);
      formData.append('userId', userId);

      const newAvatarUrl = await api.uploadAvatar(formData);
      setUser({ ...user, avatar_url: newAvatarUrl });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
      </View>

      <View style={styles.avatarContainer}>
        {uploading ? (
          <View style={[styles.avatarImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <Image 
            source={user?.avatar_url ? { uri: user.avatar_url } : require('../../assets/adaptive-icon.png')} 
            style={[styles.avatarImage, { borderColor: colors.primary }]} 
          />
        )}
        <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]} onPress={handleEditAvatar}>
          <Ionicons name="pencil" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.full_name || 'Anonymous User'}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('MyPetsScreen')}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="paw-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>My Pets</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {/* My Listings */}
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('MyListingsScreen')}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="list-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>My Listings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* My Posts */}
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('MyPostsScreen')}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="document-text-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>My Posts</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* [LIKED-POSTS] Liked Posts → new unified LikedPetsAndPostsScreen */}
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('LikedPetsAndPostsScreen')}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="heart-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Liked Posts</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('SettingsScreen')}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={22} color="#D32F2F" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingBottom: 110, 
    paddingHorizontal: 16 
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: { 
    fontSize: 24, 
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  avatarContainer: { 
    alignSelf: 'center', 
    position: 'relative', 
    marginBottom: 16 
  },
  avatarImage: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    borderWidth: 3 
  },
  editBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3 
  },
  userInfo: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  userName: { 
    fontSize: 22, 
    fontFamily: 'DMSerifDisplay_400Regular', 
    marginBottom: 4 
  },
  userEmail: { 
    fontSize: 14, 
    fontFamily: 'DMSans_400Regular' 
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 20,
    borderBottomWidth: 1 
  },
  menuLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: { 
    fontSize: 16, 
    fontFamily: 'DMSans_700Bold' 
  },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 16, 
    backgroundColor: '#FDECEA', 
    borderWidth: 1, 
    borderColor: '#F5C6C6' 
  },
  logoutIcon: {
    marginRight: 8
  },
  logoutText: { 
    fontSize: 16, 
    fontFamily: 'DMSans_700Bold', 
    color: '#D32F2F' 
  },
});