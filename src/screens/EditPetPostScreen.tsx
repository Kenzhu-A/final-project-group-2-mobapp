// [PET-EDIT] full-record edit form prefilled from the existing pet
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import CustomInput from '../components/CustomInput';
import CustomDropdown from '../components/CustomDropdown';
import PrimaryButton from '../components/PrimaryButton';
import { useImageUploader } from '../hooks/useImageUploader';
import UploadingImageTile from '../components/UploadingImageTile';

const CATEGORIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const GENDERS = ['Male', 'Female', 'Unknown'];
const SIZES_LIST = ['Small', 'Medium', 'Large'];
const TAGS_LIST = [
  'House-trained', 'Vaccinated', 'Good with kids', 'Good with other pets',
  'Neutered/Spayed', 'Energetic', 'Calm', 'Playful', 'Friendly', 'Vocal', 'Independent',
];

export default function EditPetPostScreen({ route, navigation }: any) {
  const { pet } = route.params;
  const { colors } = useTheme();
  const uploader = useImageUploader(
    pet.image_urls && pet.image_urls.length > 0
      ? pet.image_urls
      : pet.image_url ? [pet.image_url] : []
  );

  const [form, setForm] = useState({
    category: pet.category || 'Dog',
    pet_name: pet.pet_name || '',
    breed: pet.breed || '',
    age: String(pet.age ?? ''),
    price: String(pet.price ?? ''),
    location: pet.location || '',
    description: pet.description || '',
    medical_history: pet.medical_history || '',
    behavior: pet.behavior || '',
    personality: pet.personality || '',
    gender: (pet.gender || 'unknown').replace(/^./, (c: string) => c.toUpperCase()),
    weight_kg: pet.weight_kg != null ? String(pet.weight_kg) : '',
    size: (pet.size || 'medium').replace(/^./, (c: string) => c.toUpperCase()),
    tags: (pet.tags as string[]) || [],
  });
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!form.pet_name || !form.location || !form.age) {
      Alert.alert('Missing details', 'Name, location, and age are required.');
      return;
    }
    if (uploader.anyUploading) { Alert.alert('Photos still uploading', 'Please wait.'); return; }
    setSaving(true);
    try {
      const image_urls = uploader.urls;
      await api.updatePetPost(pet.id, {
        category: form.category,
        pet_name: form.pet_name,
        breed: form.breed,
        age: Number(form.age),
        price: form.price ? Number(form.price) : 0,
        location: form.location,
        description: form.description,
        image_url: image_urls[0] || null,
        image_urls,
        medical_history: form.medical_history,
        behavior: form.behavior,
        personality: form.personality,
        gender: form.gender.toLowerCase(),
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        size: form.size.toLowerCase(),
        tags: form.tags,
      });
      Alert.alert('Saved!', 'Your listing has been updated.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Post Details</Text>
        <Pressable onPress={onSave} disabled={saving || uploader.anyUploading}>
          <Text style={{ color: colors.primary, fontFamily: 'DMSans_700Bold', fontSize: 15, opacity: (saving || uploader.anyUploading) ? 0.5 : 1 }}>
            Save
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* photos */}
          <Text style={[styles.section, { color: colors.textPrimary }]}>Pet photos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {uploader.items.map((it) => (
              <UploadingImageTile key={it.uri} item={it} onRemove={() => uploader.remove(it.uri)} onRetry={() => uploader.retry(it.uri)} />
            ))}
            {uploader.items.length < uploader.MAX_IMAGES && (
              <Pressable onPress={uploader.pick} style={[styles.addTile, { borderColor: colors.border }]}>
                <Ionicons name="add" size={32} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', fontSize: 11, marginTop: 2 }}>Add</Text>
              </Pressable>
            )}
          </View>

          <CustomDropdown label="Species" value={form.category} options={CATEGORIES} onSelect={(v: string) => setForm({ ...form, category: v })} />
          <CustomInput label="Pet name *" placeholder="Buddy" value={form.pet_name} onChangeText={(t: string) => setForm({ ...form, pet_name: t })} />
          <CustomInput label="Breed" placeholder="e.g., Golden Retriever" value={form.breed} onChangeText={(t: string) => setForm({ ...form, breed: t })} />

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <CustomInput label="Age (yrs) *" value={form.age} onChangeText={(t: string) => setForm({ ...form, age: t })} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <CustomDropdown label="Sex" value={form.gender} options={GENDERS} onSelect={(v: string) => setForm({ ...form, gender: v })} />
            </View>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <CustomDropdown label="Size" value={form.size} options={SIZES_LIST} onSelect={(v: string) => setForm({ ...form, size: v })} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <CustomInput label="Weight (kg)" value={form.weight_kg} onChangeText={(t: string) => setForm({ ...form, weight_kg: t })} keyboardType="numeric" />
            </View>
          </View>

          <CustomInput label="Location *" placeholder="City, Province" value={form.location} onChangeText={(t: string) => setForm({ ...form, location: t })} />
          <CustomInput label="Adoption fee (₱)" value={form.price} onChangeText={(t: string) => setForm({ ...form, price: t })} keyboardType="numeric" />
          <CustomInput label="Description" placeholder="Tell us about this pet…" value={form.description} onChangeText={(t: string) => setForm({ ...form, description: t })} multiline />

          <Text style={[styles.section, { color: colors.textPrimary, marginTop: 16 }]}>Traits & tags</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
            {TAGS_LIST.map((tag) => {
              const active = form.tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => setForm({ ...form, tags: active ? form.tags.filter((t) => t !== tag) : [...form.tags, tag] })}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent', marginRight: 8, marginBottom: 8 }}
                >
                  <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontFamily: 'DMSans_700Bold', fontSize: 12 }}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton title="Save changes" onPress={onSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'DMSerifDisplay_400Regular' },
  section: { fontSize: 14, fontFamily: 'DMSans_700Bold', marginBottom: 12 },
  addTile: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 8 },
});
