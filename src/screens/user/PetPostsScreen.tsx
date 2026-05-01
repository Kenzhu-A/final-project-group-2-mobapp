import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function PetPostsScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real data from the backend
  const fetchPets = async () => {
    try {
      const data = await api.getAllPets();
      setPets(data);
    } catch (error) {
      console.error("Failed to fetch pets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch automatically whenever this tab is opened
  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [])
  );

  // Allows user to drag down the screen to refresh the feed
  const onRefresh = () => {
    setRefreshing(true);
    fetchPets();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Adoption Feed</Text>
      
      {pets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="paw-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No pets available for adoption right now.</Text>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 110 }} // Padding for floating navbar
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Display Pet Image or Placeholder */}
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.postImage} />
              ) : (
                <View style={styles.postImagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#FFF" />
                </View>
              )}
              
              <View style={styles.postDetails}>
                <Text style={[styles.postTitle, { color: colors.textPrimary }]}>
                  {item.pet_name} {item.breed ? `(${item.breed})` : ''}
                </Text>
                <Text style={[styles.postSubtitle, { color: colors.textSecondary }]}>
                  <Ionicons name="location-outline" /> {item.location}
                </Text>
                <Text style={[styles.postTime, { color: colors.textSecondary }]}>
                  Posted by {item.owner?.full_name || 'Anonymous User'}
                </Text>
              </View>
              
              <Pressable>
                <Ionicons name="bookmark-outline" size={24} color={colors.primary} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 16 },
  postCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  postImage: { width: 70, height: 70, borderRadius: 8, marginRight: 16 },
  postImagePlaceholder: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  postDetails: { flex: 1 },
  postTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  postSubtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  postTime: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, fontFamily: 'DMSans_400Regular', marginTop: 16, textAlign: 'center' },
});