// [DASHBOARD-REDESIGN] featured-today hero card — used inside HeroCarousel
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props {
  pet: any;
  onPress: () => void;
  onSayHi: () => void;
}

export default function FeaturedPetCard({ pet, onPress, onSayHi }: Props) {
  const { colors } = useTheme();
  if (!pet) return null;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.left}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>FEATURED TODAY</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>Meet {pet.pet_name}!</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
          {pet.description || `${pet.breed || pet.category}, ${pet.age} ${pet.age === 1 ? 'year' : 'years'} old.`}
        </Text>
        <TouchableOpacity style={[styles.sayHi, { backgroundColor: colors.accent }]} onPress={onSayHi}>
          <Text style={styles.sayHiText}>Say Hi 👋</Text>
        </TouchableOpacity>
      </View>
      <Image source={{ uri: pet.image_url }} style={styles.image} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  left: { flex: 1, paddingRight: 12, justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, fontFamily: 'DMSans_700Bold', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 4 },
  desc: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 8, lineHeight: 17 },
  sayHi: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  sayHiText: { color: '#FFF', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  image: { width: 110, height: 110, borderRadius: 16, resizeMode: 'cover' },
});
