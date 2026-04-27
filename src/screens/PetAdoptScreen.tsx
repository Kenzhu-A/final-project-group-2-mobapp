import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Modal, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import PrimaryButton from '../components/PrimaryButton';

export default function PetAdoptScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [adoptionPets, setAdoptionPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedPet, setSelectedPet] = useState<any>(null);

  const fetchAdoptionPets = async () => {
    try {
      const data = await api.getAllPets();
      setAdoptionPets(data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchAdoptionPets(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchAdoptionPets(); };

  const formatPrice = (price: number) => {
    if (!price || price === 0) return "Free";
    return `₱ ${price.toLocaleString()}`;
  };

  // Automatically construct the message and navigate to Chat
  const handleMessageOwner = async (pet: any) => {
    const senderId = await AsyncStorage.getItem('userId');
    if (!senderId) {
      Alert.alert("Error", "Session expired. Please log in again.");
      return;
    }
    
    setSelectedPet(null); // Close modal
    
    const priceText = (!pet.price || pet.price === 0) ? 'Free' : `₱ ${pet.price.toLocaleString()}`;
    const autoMessage = `Hi! I'm interested in adopting ${pet.pet_name} (${priceText}). Is it still available?`;

    navigation.navigate('ChatScreen', { 
      receiverId: pet.owner_id, 
      receiverName: pet.owner.full_name,
      senderId: senderId,
      initialMessage: autoMessage
    });
  };

  const ListHeader = () => (
    <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
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
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.9}
            onPress={() => setSelectedPet(item)}
          >
            <View style={styles.gridImageContainer}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.gridImage} />
              ) : (
                <View style={styles.gridImagePlaceholder}><Ionicons name="paw" size={40} color="#FFF" /></View>
              )}
              <View style={[styles.priceBadge, { backgroundColor: (!item.price || item.price === 0) ? '#4CAF50' : colors.primary }]}>
                <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
              </View>
            </View>

            <View style={styles.gridDetails}>
              <Text style={[styles.gridTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.pet_name}</Text>
              <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{item.breed || 'Unknown Breed'}</Text>
              <View style={styles.gridLocationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.gridLocation, { color: colors.textSecondary }]} numberOfLines={1}>{item.location}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selectedPet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedPet(null)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {selectedPet && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              
              <View style={styles.modalImageWrapper}>
                {selectedPet.image_url ? (
                  <Image source={{ uri: selectedPet.image_url }} style={styles.modalImage} />
                ) : (
                  <View style={[styles.modalImage, { backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="paw" size={80} color="#FFF" />
                  </View>
                )}
                <TouchableOpacity style={[styles.modalBackBtn, { backgroundColor: colors.surface }]} onPress={() => setSelectedPet(null)}>
                  <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.modalContentSheet, { backgroundColor: colors.background }]}>
                <View style={styles.modalTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalPetName, { color: colors.textPrimary }]}>{selectedPet.pet_name}</Text>
                    <Text style={[styles.modalLocation, { color: colors.textSecondary }]}><Ionicons name="location-outline" size={16}/> {selectedPet.location}</Text>
                  </View>
                  <Text style={[styles.modalPrice, { color: (!selectedPet.price || selectedPet.price === 0) ? '#4CAF50' : colors.primary }]}>
                    {formatPrice(selectedPet.price)}
                  </Text>
                </View>

                <View style={styles.infoBlocksRow}>
                  <View style={[styles.infoBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.infoBlockLabel, { color: colors.textSecondary }]}>Age</Text>
                    <Text style={[styles.infoBlockValue, { color: colors.textPrimary }]}>{selectedPet.age} yrs</Text>
                  </View>
                  <View style={[styles.infoBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.infoBlockLabel, { color: colors.textSecondary }]}>Breed</Text>
                    <Text style={[styles.infoBlockValue, { color: colors.textPrimary }]} numberOfLines={1}>{selectedPet.breed || 'Unknown'}</Text>
                  </View>
                </View>

                <View style={[styles.ownerRow, { borderBottomColor: colors.border, borderTopColor: colors.border }]}>
                  <Image source={selectedPet.owner?.avatar_url ? { uri: selectedPet.owner.avatar_url } : require('../../assets/adaptive-icon.png')} style={styles.ownerAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ownerLabel, { color: colors.textSecondary }]}>Listed By</Text>
                    <Text style={[styles.ownerName, { color: colors.textPrimary }]}>{selectedPet.owner?.full_name}</Text>
                  </View>
                </View>

                {selectedPet.description && (
                  <View style={styles.textSection}>
                    <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>About {selectedPet.pet_name}</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{selectedPet.description}</Text>
                  </View>
                )}
                {selectedPet.medical_history && (
                  <View style={styles.textSection}>
                    <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Medical History</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{selectedPet.medical_history}</Text>
                  </View>
                )}
                {selectedPet.behavior && (
                  <View style={styles.textSection}>
                    <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Behavior</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{selectedPet.behavior}</Text>
                  </View>
                )}
                {selectedPet.personality && (
                  <View style={styles.textSection}>
                    <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Personality</Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{selectedPet.personality}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          <View style={[styles.fixedBottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Message Owner" onPress={() => handleMessageOwner(selectedPet)} />
            </View>
          </View>
        </View>
      </Modal>
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
  sectionTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 16 },
  gridCard: { flex: 1, margin: 4, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  gridImageContainer: { position: 'relative', width: '100%', height: 160 },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gridImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  priceBadge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  priceText: { color: '#FFF', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  gridDetails: { padding: 12 },
  gridTitle: { fontSize: 16, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 2 },
  gridSubtitle: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 6 },
  gridLocationRow: { flexDirection: 'row', alignItems: 'center' },
  gridLocation: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginLeft: 4, flex: 1 },
  modalImageWrapper: { position: 'relative', width: '100%', height: 400 },
  modalImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalBackBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  modalContentSheet: { flex: 1, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 30 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalPetName: { fontSize: 32, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 4 },
  modalLocation: { fontSize: 15, fontFamily: 'DMSans_400Regular' },
  modalPrice: { fontSize: 24, fontFamily: 'DMSans_700Bold', marginTop: 4 },
  infoBlocksRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  infoBlock: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginHorizontal: 4 },
  infoBlockLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 4 },
  infoBlockValue: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 24 },
  ownerAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  ownerLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 2 },
  ownerName: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  textSection: { marginBottom: 24 },
  sectionHeading: { fontSize: 18, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 8 },
  sectionBody: { fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 24 },
  fixedBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center' },
});