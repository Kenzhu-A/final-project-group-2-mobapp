// [HERO-CAROUSEL] auto-cycling card: Featured Today <-> Lost & Found (5-second interval)
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import FeaturedPetCard from './FeaturedPetCard';

interface Props {
  featuredPet: any | null;       // null = show only L&F slide, no cycling
  onPressFeatured: () => void;
  onSayHi: () => void;
  onPressLostFound: () => void;
}

const INTERVAL_MS = 5000;

export default function HeroCarousel({ featuredPet, onPressFeatured, onSayHi, onPressLostFound }: Props) {
  const { colors } = useTheme();
  const slides = featuredPet ? ['featured', 'lostfound'] : ['lostfound'];
  const [activeIdx, setActiveIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length, opacity]);

  const activeSlide = slides[activeIdx];

  return (
    <View>
      <Animated.View style={{ opacity }}>
        {activeSlide === 'featured' && featuredPet ? (
          <FeaturedPetCard pet={featuredPet} onPress={onPressFeatured} onSayHi={onSayHi} />
        ) : (
          // [HERO-CAROUSEL] Lost & Found banner — mirrors original PetAdoptScreen card style
          <TouchableOpacity style={[styles.lfCard, { backgroundColor: colors.primary }]} onPress={onPressLostFound} activeOpacity={0.9}>
            <View style={styles.lfRow}>
              <Ionicons name="search-circle" size={36} color="#FFF" />
              <Text style={styles.lfTitle}>Lost and Found</Text>
            </View>
            <Text style={styles.lfSub}>
              Lost a pet or found a stray? Report it here to help them safely return home.
            </Text>
            <View style={styles.lfBtn}>
              <Text style={styles.lfBtnText}>View reports →</Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* page dots — only shown when there are multiple slides */}
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === activeIdx ? colors.textPrimary : colors.border }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lfCard: { borderRadius: 20, padding: 20 },
  lfRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  lfTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular', color: '#FFF', marginLeft: 8 },
  lfSub: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: '#FFF', opacity: 0.9, lineHeight: 19 },
  lfBtn: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 },
  lfBtnText: { color: '#FFF', fontFamily: 'DMSans_700Bold', fontSize: 13 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
