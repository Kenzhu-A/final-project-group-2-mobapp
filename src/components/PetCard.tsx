// [DASHBOARD-REDESIGN] grid card used by Dashboard + Saved + LikedPetsAndPostsScreen
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useSavedPets } from '../hooks/useSavedPets';
import { api } from '../services/api';

interface Props {
  pet: any;
  onPress: () => void;
}

export default function PetCard({ pet, onPress }: Props) {
  const { colors } = useTheme();
  const { savedIds, save, requestRemove } = useSavedPets();
  const isSaved = savedIds.has(pet.id);

  // [LIKED-POSTS] local like state backed by AsyncStorage
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(pet.likes_count || 0);

  useEffect(() => {
    AsyncStorage.getItem('userId').then((uid) => {
      if (!uid) return;
      AsyncStorage.getItem(`${uid}_likedPets`).then((stored) => {
        if (stored && JSON.parse(stored).includes(pet.id)) setIsLiked(true);
      });
    });
  }, [pet.id]);

  const onBookmark = (e: any) => {
    e.stopPropagation?.();
    if (isSaved) requestRemove(pet);
    else save(pet.id);
  };

  const toggleLike = async (e: any) => {
    e.stopPropagation?.();
    const uid = await AsyncStorage.getItem('userId');
    if (!uid) return;
    const next = !isLiked;
    // [DASHBOARD-REDESIGN] update local state + AsyncStorage immediately (optimistic)
    setIsLiked(next);
    setLikesCount((p) => next ? p + 1 : Math.max(0, p - 1));
    const stored = await AsyncStorage.getItem(`${uid}_likedPets`);
    let arr = stored ? JSON.parse(stored) : [];
    arr = next ? [...arr, pet.id] : arr.filter((id: string) => id !== pet.id);
    await AsyncStorage.setItem(`${uid}_likedPets`, JSON.stringify(arr));
    // Fire-and-forget backend update; UI stays consistent even if backend fails
    api.likePet(pet.id, next).catch((err) => console.warn('[LIKED-POSTS] likePet failed:', err.message));
  };

  const cityOnly = (pet.location || '').split(',')[0] || 'Unknown';
  const ageLabel = `${pet.age} ${pet.age === 1 ? 'year' : 'years'} old`;
  const genderIcon = pet.gender === 'male' ? '♂' : pet.gender === 'female' ? '♀' : '';
  const genderColor = pet.gender === 'male' ? '#3B82F6' : '#EC4899';

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.imageWrap}>
        {pet.image_url ? (
          <Image source={{ uri: pet.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="paw" size={32} color="#FFF" />
          </View>
        )}
        <Pressable style={styles.bookmarkBtn} onPress={onBookmark} hitSlop={8}>
          <View style={[styles.bookmarkBg, { backgroundColor: isSaved ? '#FBBF24' : 'rgba(255,255,255,0.85)' }]}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={16} color={isSaved ? '#FFF' : '#212529'} />
          </View>
        </Pressable>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{pet.pet_name}</Text>
          {!!genderIcon && <Text style={[styles.gender, { color: genderColor }]}>{genderIcon}</Text>}
        </View>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {pet.breed || pet.category} • {ageLabel}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={12} color={colors.primary} />
          <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>{cityOnly}</Text>
        </View>
        {/* [LIKED-POSTS] like row */}
        <View style={styles.likeRow}>
          <Pressable onPress={toggleLike} hitSlop={6}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={16} color={isLiked ? '#EF4444' : colors.textSecondary} />
          </Pressable>
          {likesCount > 0 && (
            <Text style={[styles.likeCount, { color: colors.textSecondary }]}>{likesCount}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  bookmarkBtn: { position: 'absolute', top: 8, right: 8 },
  bookmarkBg: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  info: { padding: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, fontFamily: 'DMSans_700Bold', flex: 1 },
  gender: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginLeft: 6 },
  meta: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  location: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginLeft: 4, flex: 1 },
  likeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  likeCount: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
});
