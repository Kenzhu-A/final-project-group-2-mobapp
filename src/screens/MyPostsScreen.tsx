// [POST-EDIT] populated posts with Edit + Delete actions
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function MyPostsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          const userId = await AsyncStorage.getItem('userId');
          if (!userId) return;
          const allPosts = await api.getGeneralPosts();
          const mine = allPosts.filter((post: any) => post.owner_id === userId);
          setMyPosts(mine || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
      })();
    }, [])
  );

  const handleDeletePost = async (postId: string) => {
    try {
      setDeletingPostId(postId);
      await api.deleteGeneralPost(postId);
      setMyPosts(myPosts.filter(post => post.id !== postId));
      Alert.alert('Success', 'Post deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete post');
    } finally {
      setDeletingPostId(null);
    }
  };

  const renderPostItem = ({ item }: { item: any }) => (
    <View style={[styles.postContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <Text style={[styles.postOwner, { color: colors.textSecondary }]}>{item.owner?.full_name || 'Unknown'}</Text>
        <Text style={[styles.postTime, { color: colors.textSecondary }]}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <Text style={[styles.postDescription, { color: colors.textPrimary }]}>{item.description}</Text>
      {item.image_url && <Image source={{ uri: item.image_url }} style={styles.postImage} />}
      <View style={styles.postActions}>
        <Pressable
          onPress={() => navigation.navigate('EditPost', { post: item })}
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="create" size={18} color="white" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert(
              'Delete Post',
              'Are you sure you want to delete this post?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', onPress: () => handleDeletePost(item.id), style: 'destructive' }
              ]
            );
          }}
          style={[styles.actionButton, { backgroundColor: '#A32D2D' }]}
          disabled={deletingPostId === item.id}
        >
          {deletingPostId === item.id ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="trash" size={18} color="white" />
          )}
          <Text style={styles.actionButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) return <View style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Posts</Text>
      </View>

      {myPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No posts yet.</Text>
        </View>
      ) : (
        <FlatList
          data={myPosts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={renderPostItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, marginTop: 16 },
  listContainer: { padding: 16 },
  postContainer: { borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  postOwner: { fontSize: 14 },
  postTime: { fontSize: 12 },
  postDescription: { fontSize: 16, marginBottom: 12 },
  postImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  postActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 4, gap: 4 },
  actionButtonText: { color: 'white', fontSize: 14 },
});