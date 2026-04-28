// [DASHBOARD-REDESIGN] enriched pet detail — carousel, pills, save heart, like, share, apply-to-adopt
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList, Dimensions, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import PrimaryButton from '../components/PrimaryButton';
import { useSavedPets } from '../hooks/useSavedPets';

const { width: SCREEN_W } = Dimensions.get('window');

export default function PetDetailsScreen({ route, navigation }: any) {
  const { petId } = route.params;
  const { colors } = useTheme();
  const { savedIds, save, requestRemove } = useSavedPets();

  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [readMore, setReadMore] = useState(false);

  // [LIKED-POSTS] like state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('userId');
        setCurrentUserId(uid);
        const data = await api.getPetDetails(petId);
        setPet(data);
        setLikesCount(data?.likes_count || 0);
        if (uid) {
          const stored = await AsyncStorage.getItem(`${uid}_likedPets`);
          if (stored && JSON.parse(stored).includes(data?.id)) setIsLiked(true);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [petId]);

  if (loading || !pet) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isOwner = currentUserId === pet.owner_id;
  const isSaved = savedIds.has(pet.id);
  const images: string[] =
    pet.image_urls && pet.image_urls.length > 0
      ? pet.image_urls
      : pet.image_url ? [pet.image_url] : [];

  const onApply = () => {
    navigation.navigate('ChatScreen', {
      receiverId: pet.owner_id,
      receiverName: pet.owner?.full_name || 'Pet Owner',
      senderId: currentUserId,
      initialMessage: `Hi! I'm interested in adopting ${pet.pet_name}. 🐾`,
    });
  };

  const onShare = () => {
    Share.share({ message: `Check out ${pet.pet_name} on SnoutScout!` }).catch(() => {});
  };

  const onToggleSave = () => {
    if (isSaved) requestRemove(pet);
    else save(pet.id);
  };

  const onToggleLike = async () => {
    if (!currentUserId) return;
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((p) => next ? p + 1 : Math.max(0, p - 1));
    try {
      await api.likePet(pet.id, next);
      const stored = await AsyncStorage.getItem(`${currentUserId}_likedPets`);
      let arr = stored ? JSON.parse(stored) : [];
      arr = next ? [...arr, pet.id] : arr.filter((id: string) => id !== pet.id);
      await AsyncStorage.setItem(`${currentUserId}_likedPets`, JSON.stringify(arr));
    } catch {
      setIsLiked(!next);
      setLikesCount((p) => !next ? p + 1 : Math.max(0, p - 1));
    }
  };

  const statusColor =
    pet.status === 'available' ? '#22C55E' :
    pet.status === 'adopted'   ? '#9CA3AF' : '#F59E0B';
  const statusLabel = (pet.status || 'available').replace(/^./, (c: string) => c.toUpperCase());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* image carousel */}
        <View style={styles.imageWrap}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(u, i) => `${i}-${u}`}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setPageIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
              }
              renderItem={({ item }) => <Image source={{ uri: item }} style={styles.heroImage} />}
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="paw" size={80} color="#FFF" />
            </View>
          )}

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#000" />
          </TouchableOpacity>

          {/* [DASHBOARD-REDESIGN] share + save + like icons */}
          <View style={styles.topRightActions}>
            <TouchableOpacity style={styles.iconCircle} onPress={onShare}>
              <Ionicons name="share-outline" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={onToggleLike}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? '#EF4444' : '#000'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={onToggleSave}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? '#FBBF24' : '#000'} />
            </TouchableOpacity>
          </View>

          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i === pageIdx ? '#FFF' : 'rgba(255,255,255,0.5)' }]} />
              ))}
            </View>
          )}
        </View>

        {/* content card */}
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{pet.pet_name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={[styles.location, { color: colors.textSecondary }]}>
                  {(pet.location || '').split(',')[0]}
                </Text>
              </View>
              {likesCount > 0 && (
                <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', fontSize: 12, marginTop: 2 }}>
                  ♥ {likesCount} {likesCount === 1 ? 'person likes this' : 'people like this'}
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge, { borderColor: statusColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* [DASHBOARD-REDESIGN] pill row — auto-hide when field is null/unknown */}
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>AGE</Text>
              <Text style={[styles.pillValue, { color: colors.textPrimary }]}>{pet.age} yr</Text>
            </View>
            {pet.gender && pet.gender !== 'unknown' && (
              <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="male-female" size={16} color={colors.primary} />
                <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>SEX</Text>
                <Text style={[styles.pillValue, { color: colors.textPrimary }]}>
                  {pet.gender === 'male' ? 'Male' : 'Female'}
                </Text>
              </View>
            )}
            {pet.weight_kg != null && (
              <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="barbell" size={16} color={colors.primary} />
                <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>WEIGHT</Text>
                <Text style={[styles.pillValue, { color: colors.textPrimary }]}>{pet.weight_kg} kg</Text>
              </View>
            )}
            <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="resize" size={16} color={colors.primary} />
              <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>SIZE</Text>
              <Text style={[styles.pillValue, { color: colors.textPrimary }]}>
                {(pet.size || 'medium').replace(/^./, (c: string) => c.toUpperCase())}
              </Text>
            </View>
          </View>

          {/* about */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About {pet.pet_name}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={readMore ? undefined : 4}>
            {pet.description || 'No description provided.'}
          </Text>
          {(pet.description || '').length > 200 && (
            <TouchableOpacity onPress={() => setReadMore((v) => !v)}>
              <Text style={{ color: colors.primary, fontFamily: 'DMSans_700Bold', marginTop: 4 }}>
                {readMore ? 'Read less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}

          {/* personality / tags */}
          {(pet.tags?.length > 0 || pet.personality || pet.medical_history || pet.behavior) && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Personality & Traits</Text>
              <View style={styles.tagsRow}>
                {(pet.tags || []).map((t: string) => (
                  <View key={t} style={[styles.tagChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={{ color: colors.textPrimary, fontFamily: 'DMSans_700Bold', fontSize: 12 }}>{t}</Text>
                  </View>
                ))}
                {pet.personality && !(pet.tags || []).includes(pet.personality) && (
                  <View style={[styles.tagChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={{ color: colors.textPrimary, fontFamily: 'DMSans_700Bold', fontSize: 12 }}>{pet.personality}</Text>
                  </View>
                )}
                {pet.medical_history && (
                  <View style={[styles.tagChip, { backgroundColor: '#F0FFF4', borderColor: '#86EFAC' }]}>
                    <Text style={{ color: '#166534', fontFamily: 'DMSans_700Bold', fontSize: 12 }}>{pet.medical_history}</Text>
                  </View>
                )}
                {pet.behavior && (
                  <View style={[styles.tagChip, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                    <Text style={{ color: '#9A3412', fontFamily: 'DMSans_700Bold', fontSize: 12 }}>{pet.behavior}</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* owner info */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Listed By</Text>
          <View style={[styles.ownerCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Image
              source={pet.owner?.avatar_url ? { uri: pet.owner.avatar_url } : require('../../assets/adaptive-icon.png')}
              style={styles.ownerAvatar}
            />
            <View>
              <Text style={[styles.ownerName, { color: colors.textPrimary }]}>{pet.owner?.full_name || 'Anonymous'}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular' }}>Pet Owner</Text>
            </View>
          </View>

          {/* fee + apply/manage */}
          <View style={styles.feeRow}>
            <View>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>ADOPTION FEE</Text>
              <Text style={[styles.feeValue, { color: colors.primary }]}>
                {pet.price > 0 ? `₱${pet.price}` : 'Free'}
              </Text>
            </View>
            {!isOwner ? (
              <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.accent }]} onPress={onApply}>
                <Text style={styles.applyText}>Apply to adopt</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('EditPetPostScreen', { pet })}
              >
                <Text style={styles.applyText}>Manage listing</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageWrap: { position: 'relative', height: 380, width: '100%' },
  heroImage: { width: SCREEN_W, height: 380, resizeMode: 'cover' },
  backBtn: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center' },
  topRightActions: { position: 'absolute', top: 50, right: 16, flexDirection: 'row', gap: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center' },
  dots: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  content: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  name: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  location: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginLeft: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  pill: { minWidth: 78, alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 8 },
  pillLabel: { fontSize: 9, fontFamily: 'DMSans_700Bold', letterSpacing: 0.5, marginTop: 2 },
  pillValue: { fontSize: 13, fontFamily: 'DMSans_700Bold', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginBottom: 10 },
  desc: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  ownerCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1 },
  ownerAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 14 },
  ownerName: { fontSize: 15, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  feeLabel: { fontSize: 11, fontFamily: 'DMSans_700Bold', letterSpacing: 1 },
  feeValue: { fontSize: 24, fontFamily: 'DMSans_700Bold', marginTop: 2 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, gap: 4 },
  applyText: { color: '#FFF', fontSize: 14, fontFamily: 'DMSans_700Bold' },
});
