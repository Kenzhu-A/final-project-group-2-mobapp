// [DASHBOARD-REDESIGN] full-screen filter with persistence (replaces bottom-sheet design)
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useTheme } from '../context/ThemeContext';

const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const SIZES = [
  { key: 'small',  label: 'Small'  },
  { key: 'medium', label: 'Medium' },
  { key: 'large',  label: 'Large'  },
];
const AGE_BUCKETS = [
  { key: '',       label: 'Any'        },
  { key: 'puppy',  label: 'Puppy <1'  },
  { key: 'young',  label: 'Young 1-3' },
  { key: 'adult',  label: 'Adult 3-8' },
  { key: 'senior', label: 'Senior 8+' },
];

interface Filters {
  species?: string[];
  ageBucket?: string;
  size?: string[];
  maxPrice?: number;
  city?: string;
}

export default function FilterScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const initial: Filters = route.params?.initialFilters ?? {};
  const allPets: any[] = route.params?.pets ?? [];
  const onApply: (f: Filters) => void = route.params?.onApply;

  const [species, setSpecies] = useState<string[]>(initial.species ?? []);
  const [ageBucket, setAgeBucket] = useState<string>(initial.ageBucket ?? '');
  const [size, setSize] = useState<string[]>(initial.size ?? []);
  const [maxPrice, setMaxPrice] = useState<number>(initial.maxPrice ?? 50000);
  const [city, setCity] = useState<string>(initial.city ?? '');

  const toggle = (arr: string[], v: string, setter: (n: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const previewCount = useMemo(() => {
    return allPets.filter((p) => {
      if (species.length && !species.includes(p.category)) return false;
      if (size.length && !size.includes(p.size)) return false;
      if (maxPrice < 50000 && (p.price ?? 0) > maxPrice) return false;
      if (city && !(p.location || '').toLowerCase().includes(city.toLowerCase())) return false;
      if (ageBucket) {
        const a = p.age ?? 0;
        const ok =
          (ageBucket === 'puppy' && a < 1) ||
          (ageBucket === 'young' && a >= 1 && a < 3) ||
          (ageBucket === 'adult' && a >= 3 && a < 8) ||
          (ageBucket === 'senior' && a >= 8);
        if (!ok) return false;
      }
      return true;
    }).length;
  }, [allPets, species, ageBucket, size, maxPrice, city]);

  const reset = () => {
    setSpecies([]); setAgeBucket(''); setSize([]); setMaxPrice(50000); setCity('');
  };

  const apply = () => {
    const next: Filters = {
      species: species.length ? species : undefined,
      ageBucket: ageBucket || undefined,
      size: size.length ? size : undefined,
      maxPrice: maxPrice < 50000 ? maxPrice : undefined,
      city: city.trim() || undefined,
    };
    onApply?.(next);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Filter & Search</Text>
        <TouchableOpacity onPress={reset}>
          <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.section, { color: colors.textPrimary }]}>Species</Text>
        <View style={styles.row}>
          {SPECIES.map((s) => {
            const active = species.includes(s);
            return (
              <TouchableOpacity key={s} onPress={() => toggle(species, s, setSpecies)}
                style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontFamily: 'DMSans_700Bold' }}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.textPrimary }]}>Age</Text>
        <View style={styles.row}>
          {AGE_BUCKETS.map((b) => {
            const active = ageBucket === b.key;
            return (
              <TouchableOpacity key={b.key || 'any'} onPress={() => setAgeBucket(b.key)}
                style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontFamily: 'DMSans_700Bold' }}>{b.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.textPrimary }]}>Size</Text>
        <View style={styles.row}>
          {SIZES.map((s) => {
            const active = size.includes(s.key);
            return (
              <TouchableOpacity key={s.key} onPress={() => toggle(size, s.key, setSize)}
                style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontFamily: 'DMSans_700Bold' }}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.textPrimary }]}>Adoption Fee (max ₱{maxPrice.toLocaleString()})</Text>
        <Slider
          minimumValue={0}
          maximumValue={50000}
          step={500}
          value={maxPrice}
          onValueChange={setMaxPrice}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />

        <Text style={[styles.section, { color: colors.textPrimary }]}>City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Quezon City"
          placeholderTextColor={colors.textSecondary}
          style={[styles.cityInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
        />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={apply} style={[styles.applyBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.applyText}>Apply ({previewCount})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  resetText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  section: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginTop: 20, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  cityInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
  applyBtn: { padding: 16, borderRadius: 28, alignItems: 'center' },
  applyText: { color: '#FFF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
});
