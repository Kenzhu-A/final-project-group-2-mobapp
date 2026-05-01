// [DASHBOARD-REDESIGN] full-screen filter with persistence (replaces bottom-sheet design)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
// [OTHER-CATEGORY] anything outside standard list is treated as "Other"
const STANDARD_CATS = ['Dog', 'Cat', 'Bird', 'Rabbit'];
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

function parseAgeYears(age: any): number {
  if (age == null) return 0;
  if (typeof age === 'number' && Number.isFinite(age)) return age;
  if (typeof age === 'string') {
    const s = age.trim().toLowerCase();
    // supports "2 Years", "6 Months", "1.5 years", "8+"
    const num = parseFloat(s.replace(/[^\d.]+/g, ''));
    if (!Number.isFinite(num)) return 0;
    if (s.includes('month')) return num / 12;
    return num;
  }
  return 0;
}

export default function FilterScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const initial: Filters = route.params?.initialFilters ?? {};
  const allPets: any[] = route.params?.pets ?? [];
  const filtersStorageKey: string = route.params?.filtersStorageKey ?? 'dashboardFilters_v1';

  const [species, setSpecies] = useState<string[]>(initial.species ?? []);
  const [ageBucket, setAgeBucket] = useState<string>(initial.ageBucket ?? '');
  const [size, setSize] = useState<string[]>(initial.size ?? []);
  const [maxPrice, setMaxPrice] = useState<number>(initial.maxPrice ?? 50000);
  const [city, setCity] = useState<string>(initial.city ?? '');
  const [locationQuery, setLocationQuery] = useState(initial.city ?? '');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);
  const [provincesMap, setProvincesMap] = useState<Record<string, string>>({});

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch('https://psgc.gitlab.io/api/provinces/');
        const data = await res.json();
        const map: Record<string, string> = {};
        data.forEach((p: any) => { map[p.code] = p.name; });
        setProvincesMap(map);
      } catch (e) {
        console.error("Failed to fetch provinces", e);
      }
    };
    if (Object.keys(provincesMap).length === 0) {
      fetchProvinces();
    }
  }, []);

  const fetchLocations = async (query: string) => {
    setLocationQuery(query);
    if (query.length < 3) {
      setLocationResults([]);
      setShowLocationList(false);
      return;
    }
    
    setIsFetchingLocations(true);
    setShowLocationList(true);
    try {
      const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/`);
      const data = await response.json();
      const filtered = data.filter((loc: any) => loc.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5); 
      setLocationResults(filtered);
    } catch (error) {
      console.error("Location fetch failed", error);
    } finally {
      setIsFetchingLocations(false);
    }
  };

  const selectLocation = (loc: any) => {
    const provinceName = loc.provinceCode ? provincesMap[loc.provinceCode] : 'Metro Manila';
    const fullName = `${loc.name}, ${provinceName}`;
    setCity(fullName);
    setLocationQuery(fullName);
    setShowLocationList(false);
  };

  const toggle = (arr: string[], v: string, setter: (n: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const reset = () => {
    setSpecies([]); 
    setAgeBucket(''); 
    setSize([]); 
    setMaxPrice(50000); 
    setCity('');
    setLocationQuery('');
    setShowLocationList(false);
  };

  const apply = () => {
    const next: Filters = {
      species: species.length ? species : undefined,
      ageBucket: ageBucket || undefined,
      size: size.length ? size : undefined,
      maxPrice: maxPrice < 50000 ? maxPrice : undefined,
      city: city.trim() || undefined,
    };
    AsyncStorage.setItem(filtersStorageKey, JSON.stringify(next)).catch(() => {});
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Filter & Search</Text>
        <Pressable onPress={reset}>
          <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.section, { color: colors.textPrimary }]}>Species</Text>
        <View style={styles.row}>
          {SPECIES.map((s) => {
            const active = species.includes(s);
            return (
              <Pressable key={s} onPress={() => toggle(species, s, setSpecies)}
                style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontFamily: 'DMSans_700Bold' }}>{s}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.textPrimary }]}>Age</Text>
        <View style={styles.row}>
          {AGE_BUCKETS.map((b) => {
            const active = ageBucket === b.key;
            return (
              <Pressable key={b.key || 'any'} onPress={() => setAgeBucket(b.key)}
                style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontFamily: 'DMSans_700Bold' }}>{b.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.textPrimary }]}>Size</Text>
        <View style={styles.row}>
          {SIZES.map((s) => {
            const active = size.includes(s.key);
            return (
              <Pressable key={s.key} onPress={() => toggle(size, s.key, setSize)}
                style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' }]}>
                <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontFamily: 'DMSans_700Bold' }}>{s.label}</Text>
              </Pressable>
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
        <View style={styles.autocompleteContainer}>
          <TextInput
            value={locationQuery}
            onChangeText={fetchLocations}
            placeholder="Start typing a Philippine city..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.cityInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
          {showLocationList && (
            <View style={[styles.autocompleteList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {isFetchingLocations ? (
                <ActivityIndicator style={{ padding: 10 }} color={colors.primary} />
              ) : locationResults.length > 0 ? (
                locationResults.map((loc, index) => {
                  const provName = loc.provinceCode ? provincesMap[loc.provinceCode] : 'Metro Manila';
                  return (
                    <Pressable key={index} style={[styles.autocompleteItem, { borderBottomColor: colors.border }]} onPress={() => selectLocation(loc)}>
                      <Text style={{ color: colors.textPrimary, fontFamily: 'DMSans_400Regular' }}>{loc.name}, {provName}</Text>
                    </Pressable>
                  )
                })
              ) : (
                <Text style={{ padding: 10, color: colors.textSecondary }}>No cities found</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable onPress={apply} style={[styles.applyBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>
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
  autocompleteContainer: { marginBottom: 16, position: 'relative', zIndex: 10 },
  cityInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: 'DMSans_400Regular', fontSize: 14 },
  autocompleteList: { position: 'absolute', top: 50, left: 0, right: 0, borderWidth: 1, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, zIndex: 100, maxHeight: 200 },
  autocompleteItem: { padding: 12, borderBottomWidth: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
  applyBtn: { padding: 16, borderRadius: 28, alignItems: 'center' },
  applyText: { color: '#FFF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
});
