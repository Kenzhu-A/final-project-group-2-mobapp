import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

const CATEGORIES = ['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];

export default function PetAdoptScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // --- SEARCH & FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchPets = async () => {
    try {
      const data = await api.getAllPets();
      setPets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPets();
  };

  // --- FILTERING LOGIC ---
  const filteredPets = pets.filter(pet => {
    // 1. Check if it matches the Search text (checks name, breed, and location)
    const matchesSearch = 
      (pet.pet_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (pet.breed?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (pet.location?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    // 2. Check if it matches the selected Category Tab
    const matchesCategory = selectedCategory === 'All' || pet.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // --- LIST HEADER (Lost & Found + Search Bar + Filters) ---
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      
      {/* 1. LOST AND FOUND BANNER */}
      <TouchableOpacity 
        style={[styles.lostAndFoundCard, { backgroundColor: colors.primary, borderColor: colors.border }]}
        onPress={() => navigation.navigate('LostAndFoundScreen')}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="search-circle" size={36} color="#FFF" />
          <Text style={styles.lostAndFoundTitle}>Lost and Found</Text>
        </View>
        <Text style={styles.lostAndFoundSubtitle}>
          Have you lost a pet or found a stray? Report it here to help them safely return home.
        </Text>
      </TouchableOpacity>

      {/* 2. SEARCH BAR */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search by name, breed, or location..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 3. CATEGORY FILTERS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {CATEGORIES.map(category => (
          <TouchableOpacity 
            key={category}
            style={[
              styles.filterChip, 
              { borderColor: colors.border },
              selectedCategory === category && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.filterText, 
              { color: selectedCategory === category ? '#FFF' : colors.textPrimary }
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available for Adoption</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredPets}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // Grid Layout!
        contentContainerStyle={{ paddingBottom: 100 }}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={ListHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="paw-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pets match your search.</Text>
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCategory('All'); }} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.primary, fontFamily: 'DMSans_700Bold' }}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.petCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('PetDetailsScreen', { petId: item.id })}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.petImage} />
            ) : (
              <View style={[styles.petImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="paw" size={40} color="#FFF" />
              </View>
            )}
            
            <View style={styles.petInfo}>
              <Text style={[styles.petName, { color: colors.textPrimary }]} numberOfLines={1}>{item.pet_name}</Text>
              <Text style={[styles.petBreed, { color: colors.textSecondary }]} numberOfLines={1}>{item.category} • {item.breed || 'Unknown'}</Text>
              
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={[styles.petLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.location ? item.location.split(',')[0] : 'Unknown'}
                </Text>
              </View>

              <View style={styles.bottomRow}>
                <Text style={[styles.petAge, { color: colors.textPrimary }]}>{item.age} yrs</Text>
                <Text style={[styles.petPrice, { color: colors.primary }]}>
                  {item.price > 0 ? `₱${item.price}` : 'Free'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { paddingHorizontal: 16, paddingTop: 16 },
  
  // Lost and Found Banner
  lostAndFoundCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  lostAndFoundTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular', color: '#FFF', marginLeft: 8 },
  lostAndFoundSubtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: '#FFF', opacity: 0.9, lineHeight: 20 },
  
  // Search Bar
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 24, paddingHorizontal: 16, borderWidth: 1, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  
  // Filter Chips
  filterScroll: { paddingBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  
  sectionTitle: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 16 },
  row: { justifyContent: 'space-between', paddingHorizontal: 16 },
  
  // Pet Card
  petCard: { width: '48%', borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  petImage: { width: '100%', height: 140, resizeMode: 'cover' },
  petInfo: { padding: 12 },
  petName: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  petBreed: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  petLocation: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginLeft: 4, flex: 1 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 8 },
  petAge: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  petPrice: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  
  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginTop: 16, lineHeight: 24 },
});