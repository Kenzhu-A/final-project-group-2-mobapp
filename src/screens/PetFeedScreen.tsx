import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import GeneralPostCard from '../components/GeneralPostCard'; // IMPORT OUR NEW COMPONENT

export default function PetFeedScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const data = await api.getGeneralPosts();
      setPosts(data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchPosts(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Community</Text>
      
      {posts.length === 0 ? (
        <View style={styles.center}><Text style={{ color: colors.textSecondary }}>No posts yet.</Text></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 110 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          // USE OUR COMPONENT!
          renderItem={({ item }) => <GeneralPostCard item={item} colors={colors} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 12, paddingHorizontal: 16 },
});