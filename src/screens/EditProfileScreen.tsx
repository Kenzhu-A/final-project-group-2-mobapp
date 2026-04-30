import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function EditProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const userData = await api.getUserProfile(userId);
          setUser(userData);
          setFullName(userData.full_name || '');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleEditAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Camera roll access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setUploading(true);
      try {
        const userId = await AsyncStorage.getItem('userId');
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;

        const formData = new FormData();
        formData.append('avatar', { uri, name: filename, type } as any);
        formData.append('userId', userId!);

        const newAvatarUrl = await api.uploadAvatar(formData);
        setUser({ ...user, avatar_url: newAvatarUrl });
        Alert.alert('Success', 'Profile picture updated!');
      } catch (error: any) {
        Alert.alert('Upload Failed', error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      await api.updateProfile(userId, fullName);
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Going back automatically triggers the ProfileScreen to re-fetch the new data
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) return <View style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarContainer}>
            {uploading ? (
              <View style={[styles.avatarImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface }]}>
                <ActivityIndicator color={colors.primary}/>
              </View>
            ) : (
              <Image source={user?.avatar_url ? { uri: user.avatar_url } : require('../../assets/adaptive-icon.png')} style={[styles.avatarImage, { borderColor: colors.primary }]} />
            )}
            <Pressable style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]} onPress={handleEditAvatar}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </Pressable>
          </View>

          <CustomInput label="Full Name" placeholder="Your Name" value={fullName} onChangeText={setFullName} />
          <CustomInput label="Email Address" placeholder="Your Email" value={user?.email || ''} editable={false} />
          
          <View style={{ marginTop: 24 }}>
            <PrimaryButton title="Save Changes" onPress={handleUpdateProfile} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  content: { padding: 24 },
  avatarContainer: { alignSelf: 'center', position: 'relative', marginBottom: 30, marginTop: 10 },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 2 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
});