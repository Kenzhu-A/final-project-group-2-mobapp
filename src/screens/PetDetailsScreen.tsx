import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import PrimaryButton from '../components/PrimaryButton';

export default function PetDetailsScreen({ route, navigation }: any) {
  const { petId } = route.params;
  const { colors } = useTheme();
  
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const uid = await AsyncStorage.getItem('userId');
        setCurrentUserId(uid);
        const data = await api.getPetDetails(petId);
        setPet(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [petId]);

  if (loading || !pet) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isOwner = currentUserId === pet.owner_id;

  const handleMessageOwner = () => {
    navigation.navigate('ChatScreen', {
      receiverId: pet.owner_id,
      receiverName: pet.owner?.full_name || 'Pet Owner',
      senderId: currentUserId,
      initialMessage: `Hi! I saw ${pet.pet_name} on the adoption board and I'm interested!`
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Image Header */}
        <View style={styles.imageContainer}>
          {pet.image_url ? (
            <Image source={{ uri: pet.image_url }} style={styles.petImage} />
          ) : (
            <View style={[styles.petImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="paw" size={80} color="#FFF" />
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Main Details */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.petName, { color: colors.textPrimary }]}>{pet.pet_name}</Text>
              <Text style={[styles.petBreed, { color: colors.textSecondary }]}>{pet.category} • {pet.breed}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.price, { color: colors.primary }]}>{pet.price > 0 ? `₱${pet.price}` : 'Free'}</Text>
              <Text style={[styles.age, { color: colors.textSecondary }]}>{pet.age} years old</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{pet.location}</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {pet.medical_history && (
              <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="medical" size={14} color="#4CAF50" style={{ marginRight: 6 }} />
                <Text style={[styles.tagText, { color: colors.textPrimary }]}>{pet.medical_history}</Text>
              </View>
            )}
            {pet.behavior && (
              <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="happy" size={14} color="#FF9800" style={{ marginRight: 6 }} />
                <Text style={[styles.tagText, { color: colors.textPrimary }]}>{pet.behavior}</Text>
              </View>
            )}
            {pet.personality && (
              <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="star" size={14} color="#9C27B0" style={{ marginRight: 6 }} />
                <Text style={[styles.tagText, { color: colors.textPrimary }]}>{pet.personality}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About {pet.pet_name}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{pet.description || 'No description provided.'}</Text>

          {/* Owner Info */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Listed By</Text>
          <View style={[styles.ownerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image source={pet.owner?.avatar_url ? { uri: pet.owner.avatar_url } : require('../../assets/adaptive-icon.png')} style={styles.ownerAvatar} />
            <View>
              <Text style={[styles.ownerName, { color: colors.textPrimary }]}>{pet.owner?.full_name || 'Anonymous'}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Pet Owner</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {isOwner ? (
          <PrimaryButton title="Manage Listing" onPress={() => navigation.navigate('MyPetsScreen')} />
        ) : (
          <PrimaryButton title="Message Owner" onPress={handleMessageOwner} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  imageContainer: { position: 'relative', height: 350, width: '100%' },
  petImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, backgroundColor: '#FFF' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  petName: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 4 },
  petBreed: { fontSize: 15, fontFamily: 'DMSans_400Regular' },
  price: { fontSize: 22, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  age: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationText: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginLeft: 6 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  sectionTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', marginBottom: 12 },
  description: { fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 24 },
  ownerCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
  ownerAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  ownerName: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, borderTopWidth: 1 },
});