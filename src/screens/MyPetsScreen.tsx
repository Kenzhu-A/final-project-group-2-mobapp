import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function MyPetsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [myPets, setMyPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPets = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const data = await api.getMyPets(userId);
      setMyPets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchMyPets(); }, []));

  const toggleStatus = async (pet: any) => {
    const newStatus = pet.status === 'available' ? 'adopted' : 'available';
    setMyPets(prev => prev.map(p => p.id === pet.id ? { ...p, status: newStatus } : p));
    try {
      await api.updatePetStatus(pet.id, newStatus);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update status');
      setMyPets(prev => prev.map(p => p.id === pet.id ? { ...p, status: pet.status } : p));
    }
  };

  const handleDeletePet = (petId: string) => {
    Alert.alert("Delete Listing", "Are you sure you want to remove this pet listing?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await api.deletePetPost(petId);
            setMyPets(prev => prev.filter(p => p.id !== petId));
          } catch (e) { 
            Alert.alert("Error", "Could not delete post."); 
          }
        }
      }
    ]);
  };

  if (loading) return <View style={[styles.safeArea, { backgroundColor: colors.background, justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Pets</Text>
      </View>

      {myPets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="paw-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No pets listed yet.</Text>
        </View>
      ) : (
        <FlatList
          data={myPets}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.petCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.petImage} />
              ) : (
                <View style={[styles.petImage, { backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="paw" size={30} color="#FFF" />
                </View>
              )}
              
              <View style={styles.petDetails}>
                <Text style={[styles.petName, { color: colors.textPrimary }]} numberOfLines={1}>{item.pet_name}</Text>
                <Text style={[styles.petInfo, { color: colors.textSecondary }]} numberOfLines={1}>{item.category} • {item.breed}</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <View style={[styles.statusDot, { backgroundColor: item.status === 'available' ? '#4CAF50' : colors.primary }]} />
                  <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                    {item.status === 'available' ? 'Available' : 'Adopted'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionColumn}>
                <Pressable 
                  style={[styles.toggleBtn, { borderColor: item.status === 'available' ? colors.border : colors.primary, backgroundColor: item.status === 'available' ? colors.surface : colors.primary + '15' }]} 
                  onPress={() => toggleStatus(item)}
                >
                  <Text style={[styles.toggleBtnText, { color: item.status === 'available' ? colors.textPrimary : colors.primary }]}>
                    {item.status === 'available' ? 'Mark Adopted' : 'Mark Available'}
                  </Text>
                </Pressable>

                <Pressable style={styles.deleteBtn} onPress={() => handleDeletePet(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                </Pressable>
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
  listContainer: { padding: 16, paddingBottom: 50 },
  petCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, marginBottom: 16, borderWidth: 1 },
  petImage: { width: 65, height: 65, borderRadius: 12, marginRight: 12 },
  petDetails: { flex: 1, marginRight: 8, justifyContent: 'center' },
  petName: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  petInfo: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontFamily: 'DMSans_400Regular', textTransform: 'capitalize' },
  actionColumn: { flexDirection: 'row', alignItems: 'center' },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, minWidth: 100, alignItems: 'center' },
  toggleBtnText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  deleteBtn: { padding: 8, marginLeft: 8 },
});