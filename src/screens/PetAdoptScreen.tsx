import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function PetAdoptScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [adoptionPets, setAdoptionPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdoptionPets = async () => {
    try {
      const data = await api.getAllPets();
      setAdoptionPets(data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchAdoptionPets(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchAdoptionPets(); };

  // Reusable Header for the FlatList to keep scrolling smooth
  const ListHeader = () => (
    <View style={{ marginBottom: 16 }}>
      <TouchableOpacity style={[styles.lostAndFoundCard, { backgroundColor: colors.primary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="search-circle" size={36} color="#FFF" />
          <Text style={styles.lostAndFoundTitle}>Lost and Found</Text>
        </View>
        <Text style={styles.lostAndFoundSubtitle}>
          Have you lost a pet or found a stray? Report it here to help them safely return home.
        </Text>
      </TouchableOpacity>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available for Adoption</Text>
    </View>
  );

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Adopt & Rescue</Text>

      <FlatList
        data={adoptionPets}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.postImage} />
            ) : (
              <View style={styles.postImagePlaceholder}><Ionicons name="paw-outline" size={30} color="#FFF" /></View>
            )}
            <View style={styles.postDetails}>
              <Text style={[styles.postTitle, { color: colors.textPrimary }]}>{item.pet_name} {item.breed ? `(${item.breed})` : ''}</Text>
              <Text style={[styles.postSubtitle, { color: colors.textSecondary }]}><Ionicons name="location-outline" /> {item.location}</Text>
              <Text style={[styles.postTime, { color: colors.textSecondary }]}>Posted by {item.owner?.full_name}</Text>
            </View>
            <TouchableOpacity><Ionicons name="chevron-forward" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 16, paddingHorizontal: 16 },
  
  lostAndFoundCard: { padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  lostAndFoundTitle: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#FFF', marginLeft: 10 },
  lostAndFoundSubtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: '#FFF', opacity: 0.9, lineHeight: 20 },
  sectionTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 12 },

  postCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  postImage: { width: 70, height: 70, borderRadius: 8, marginRight: 16 },
  postImagePlaceholder: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  postDetails: { flex: 1 },
  postTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  postSubtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  postTime: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 4 },
});