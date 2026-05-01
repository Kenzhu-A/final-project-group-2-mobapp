import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function EditPostScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { post } = route.params;
  const [description, setDescription] = useState(post.description);
  const [imageUrl, setImageUrl] = useState(post.image_url || '');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEditImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to allow camera roll access to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('post_image', {
          uri: result.assets[0].uri,
          name: result.assets[0].uri.split('/').pop(),
          type: 'image/jpeg',
        } as any);

        const uploadedUrl = await api.uploadPostImage(formData);
        setImageUrl(uploadedUrl);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Description cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const updatedPost = await api.updateGeneralPost(post.id, {
        description: description.trim(),
        image_url: imageUrl,
      });

      Alert.alert('Success', 'Post updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Post</Text>
        <Pressable onPress={handleSave} disabled={loading} style={styles.saveBtn}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Description</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.textPrimary, marginTop: 20 }]}>Post Image</Text>
        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
            <Pressable onPress={handleEditImage} style={[styles.editImageBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.editImageText}>Change Image</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={handleEditImage} style={[styles.uploadBtn, { backgroundColor: colors.primary }]} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.uploadText}>Upload Image</Text>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveBtn: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageContainer: {
    marginTop: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  editImageBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  editImageText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
  },
  uploadBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  uploadText: {
    color: 'white',
    fontWeight: '500',
  },
});