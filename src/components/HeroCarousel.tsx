// [HERO-CAROUSEL] swipeable auto-cycling card: Featured Today <-> Lost & Found (60-second interval)
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import FeaturedPetCard from './FeaturedPetCard';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_H = 140; // fixed height so both slides are identical
const INTERVAL_MS = 60_000; // 1 minute

interface Props {
  featuredPet: any | null;
  onPressFeatured: () => void;
  onSayHi: () => void;
  onPressLostFound: () => void;
  isOwnerOfFeatured?: boolean; // [HERO-CAROUSEL] passed down to FeaturedPetCard
}

export default function HeroCarousel({ featuredPet, onPressFeatured, onSayHi, onPressLostFound, isOwnerOfFeatured = false }: Props) {
  const { colors } = useTheme();
  const slides = featuredPet ? ['featured', 'lostfound'] : ['lostfound'];
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  // track user-driven swipe so we don't fight with the auto-scroll
  const isScrollingRef = useRef(false);

  // auto-advance every INTERVAL_MS
  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      if (isScrollingRef.current) return;
      const next = (activeIdx + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
      setActiveIdx(next);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length, activeIdx]);

  const onScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== activeIdx) setActiveIdx(idx);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => { isScrollingRef.current = true; }}
        onMomentumScrollEnd={() => { isScrollingRef.current = false; }}
        style={{ borderRadius: 20, overflow: 'hidden' }}
      >
        {/* Slide 1 — Featured Today */}
        {featuredPet && (
          <View style={[styles.slide, { width: SCREEN_W - 40 }]}>
            <FeaturedPetCard
              pet={featuredPet}
              onPress={onPressFeatured}
              onSayHi={onSayHi}
              fixedHeight={CARD_H}
              isOwner={isOwnerOfFeatured}
            />
          </View>
        )}

        {/* Slide 2 — Lost & Found */}
        <TouchableOpacity
          style={[styles.slide, styles.lfCard, { width: SCREEN_W - 40, backgroundColor: colors.primary }]}
          onPress={onPressLostFound}
          activeOpacity={0.9}
        >
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
      </ScrollView>

      {/* page dots */}
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === activeIdx ? colors.textPrimary : colors.border },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { overflow: 'hidden' },
  lfCard: { borderRadius: 20, padding: 20, height: CARD_H, justifyContent: 'center' },
  lfRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  lfTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular', color: '#FFF', marginLeft: 8 },
  lfSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: '#FFF', opacity: 0.9, lineHeight: 17 },
  lfBtn: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  lfBtnText: { color: '#FFF', fontFamily: 'DMSans_700Bold', fontSize: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
