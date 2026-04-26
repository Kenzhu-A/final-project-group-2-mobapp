import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { api } from '../services/api';

interface ProfileProps {
  navigation: any;
  isDarkMode: boolean;
  handleSignOut: () => void;
}

export default function ProfileScreen({ navigation, isDarkMode, handleSignOut }: ProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Dynamic Theme Colors
  const currentText = isDarkMode ? '#FFFFFF' : theme.colors.textDark;
  const currentSubtext = isDarkMode ? '#AAAAAA' : theme.colors.textLight;
  const currentCardBg = isDarkMode ? '#1E1E1E' : theme.colors.surface;
  const currentBorder = isDarkMode ? '#333333' : theme.colors.border;

  useEffect(() => {
    // Fetch the current user's data when the profile tab loads
    const loadUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const userData = await api.getUserProfile(userId);
          setUser(userData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // --- AVATAR UPLOAD LOGIC ---
  const handleEditAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to allow camera roll access to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Force a square crop for perfect circles!
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

      // Convert image to a file object that multer can read
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('avatar', { uri, name: filename, type } as any);
      formData.append('userId', userId);

      // Call our new API route
      const newAvatarUrl = await api.uploadAvatar(formData);
      
      // Update local state instantly
      setUser({ ...user, avatar_url: newAvatarUrl });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.headerTitle, { color: currentText }]}>Profile</Text>

      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        {uploading ? (
          <View style={[styles.avatarImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: currentCardBg }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : (
          <Image 
            source={user?.avatar_url ? { uri: user.avatar_url } : require('../../assets/adaptive-icon.png')} 
            style={styles.avatarImage} 
          />
        )}
        
        {/* The Pencil Edit Button */}
        <TouchableOpacity style={styles.editBadge} onPress={handleEditAvatar}>
          <Ionicons name="pencil" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: currentText }]}>{user?.full_name || 'Anonymous User'}</Text>
        <Text style={[styles.userEmail, { color: currentSubtext }]}>{user?.email}</Text>
      </View>

      {/* Navigation Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: currentBorder }]} onPress={() => navigation.navigate('MyPostsScreen')}>
          <View style={styles.menuLeft}>
            <Ionicons name="document-text-outline" size={24} color={currentText} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: currentText }]}>My Posts</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={currentSubtext} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: currentBorder }]} onPress={() => navigation.navigate('SavedPostsScreen')}>
          <View style={styles.menuLeft}>
            <Ionicons name="bookmark-outline" size={24} color={currentText} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: currentText }]}>Saved Posts</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={currentSubtext} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: currentBorder }]} onPress={() => navigation.navigate('SettingsScreen')}>
          <View style={styles.menuLeft}>
            <Ionicons name="settings-outline" size={24} color={currentText} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: currentText }]}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={currentSubtext} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={22} color={theme.colors.error} style={styles.menuIcon} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.m, paddingBottom: 110 },
  headerTitle: { fontSize: 24, fontFamily: theme.typography.headingFont, marginBottom: theme.spacing.l, textAlign: 'center' },
  
  avatarContainer: { alignSelf: 'center', position: 'relative', marginBottom: theme.spacing.m },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: theme.colors.primary },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.colors.background },
  
  userInfo: { alignItems: 'center', marginBottom: theme.spacing.xl },
  userName: { fontSize: 20, fontFamily: theme.typography.headingFont, marginBottom: 4 },
  userEmail: { fontSize: 14, fontFamily: theme.typography.bodyFont },
  
  menuContainer: { marginBottom: theme.spacing.xl },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 16 },
  menuText: { fontSize: 16, fontFamily: theme.typography.bodyFontBold },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: theme.radius.button, backgroundColor: '#FDECEA', borderWidth: 1, borderColor: theme.colors.error },
  logoutText: { fontSize: 16, fontFamily: theme.typography.bodyFontBold, color: theme.colors.error },
});