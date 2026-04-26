import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import GeneralPostCard from '../components/GeneralPostCard';

export default function SavedPostsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchSavedPosts = async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (!userId) return;

          const allPosts = await api.getGeneralPosts();
          
          // Use the specific user ID key
          const stored = await AsyncStorage.getItem(`${userId}_savedPosts`);
          const savedIds = stored ? JSON.parse(stored) : [];
          
          const filtered = allPosts.filter((post: any) => savedIds.includes(post.id));
          setSavedPosts(filtered);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchSavedPosts();
    }, [])
  );

  if (loading) return <View style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Saved Posts</Text>
      </View>

      {savedPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No saved posts yet.</Text>
        </View>
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 50 }}
          renderItem={({ item }) => <GeneralPostCard item={item} colors={colors} />}
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
});