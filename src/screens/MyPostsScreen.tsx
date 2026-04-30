import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function MyPostsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchMyPosts = async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          const allPosts = await api.getGeneralPosts();
          
          // Filter to only show posts created by the current user
          const mine = allPosts.filter((post: any) => post.owner_id === userId);
          setMyPosts(mine);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchMyPosts();
    }, [])
  );

  if (loading) return <View style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
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
          renderItem={({ item }) => (
            <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.postImage} />
              ) : null}
              <View style={styles.postDetails}>
                <Text style={[styles.postTitle, { color: colors.textPrimary }]} numberOfLines={2}>{item.description}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular', marginTop: 16 },
  listContainer: { padding: 16 },
  postCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  postImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  postDetails: { flex: 1 },
  postTitle: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
});