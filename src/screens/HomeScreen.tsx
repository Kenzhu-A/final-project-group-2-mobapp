import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, LayoutAnimation, UIManager, Platform, TouchableOpacity, ActivityIndicator, Image, ScrollView, Alert, KeyboardAvoidingView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import BottomNavBar from '../components/BottomNavBar';
import CustomInput from '../components/CustomInput';
import CustomDropdown from '../components/CustomDropdown';
import PrimaryButton from '../components/PrimaryButton';

import ProfileScreen from './ProfileScreen';
import PetChatsScreen from './PetChatsScreen';
// [DASHBOARD-REDESIGN] new tab screens
import DashboardScreen from './DashboardScreen';
import SavedPetsScreen from './SavedPetsScreen';

import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- PREDEFINED DROPDOWN LISTS ---
const CATEGORIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const DOG_BREEDS = ['Aspin', 'Golden Retriever', 'Shih Tzu', 'Husky', 'Pomeranian', 'Beagle', 'Pug', 'Bulldog', 'Mixed/Other'];
const CAT_BREEDS = ['Puspin', 'Persian', 'Siamese', 'British Shorthair', 'Maine Coon', 'Sphynx', 'Mixed/Other'];
const MEDICAL_HISTORY = ['Fully Vaccinated', 'Partially Vaccinated', 'Unvaccinated', 'Neutered/Spayed', 'Needs Medical Attention', 'Healthy (No Records)'];
const BEHAVIORS = ['Calm', 'Energetic', 'Playful', 'Aggressive', 'Timid/Shy', 'Good with kids', 'Good with other pets'];
const PERSONALITIES = ['Sweet', 'Independent', 'Clingy', 'Protective', 'Friendly', 'Vocal', 'Lazy'];

export default function HomeScreen({ navigation }: any) {
  const { colors, resetTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('home'); // [DASHBOARD-REDESIGN]

  // --- POST CREATION STATE ---
  const [postType, setPostType] = useState<'general' | 'adoption'>('general');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [generalDesc, setGeneralDesc] = useState('');
  const [petForm, setPetForm] = useState({ 
    category: 'Dog', petName: '', breed: '', age: '', price: '', location: '', description: '', medicalHistory: '', behavior: '', personality: '' 
  });

  // --- LOCATION API STATE ---
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);
  const [provincesMap, setProvincesMap] = useState<Record<string, string>>({});

  useFocusEffect(useCallback(() => { 
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true); 
    return () => sub.remove(); 
  }, []));

  useEffect(() => {
    // Fetch Philippine Provinces ONCE in the background when app loads
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

  const handleTabChange = (tab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

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
    setPetForm({ ...petForm, location: fullName });
    setLocationQuery(fullName);
    setShowLocationList(false);
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('userId');
    await resetTheme();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: postType === 'general' ? [1, 1] : [4, 5], 
      quality: 0.8,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const uploadImageIfSelected = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    const filename = selectedImage.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;
    const formData = new FormData();
    if (postType === 'general') {
      formData.append('post_image', { uri: selectedImage, name: filename, type } as any);
      return await api.uploadPostImage(formData);
    } else {
      formData.append('pet_image', { uri: selectedImage, name: filename, type } as any);
      return await api.uploadPetImage(formData);
    }
  };

  const handleSubmitGeneralPost = async () => {
    if (!generalDesc && !selectedImage) {
      Alert.alert('Empty Post', 'Please write a description or select an image.');
      return;
    }
    setIsSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const uploadedImageUrl = await uploadImageIfSelected();

      await api.createGeneralPost({
        owner_id: userId,
        description: generalDesc,
        image_url: uploadedImageUrl
      });
      
      Alert.alert('Success!', 'Posted to the community feed.');
      setGeneralDesc('');
      setSelectedImage(null);
      setActiveTab('home'); // [DASHBOARD-REDESIGN]
    } catch (e: any) { Alert.alert('Error', e.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleSubmitAdoptionPost = async () => {
    if (!petForm.petName || !petForm.location || !petForm.age || !petForm.category || !petForm.breed) {
      Alert.alert('Missing Details', 'Please fill in all required fields (Category, Name, Breed, Age, Location).');
      return;
    }
    if (isNaN(Number(petForm.age))) {
      Alert.alert('Invalid Age', 'Age must contain only numbers.');
      return;
    }
    if (petForm.price && isNaN(Number(petForm.price))) {
      Alert.alert('Invalid Price', 'Price must contain only numbers.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const uploadedImageUrl = await uploadImageIfSelected();

      await api.createPetPost({
        owner_id: userId, category: petForm.category, image_url: uploadedImageUrl,
        pet_name: petForm.petName, breed: petForm.breed, 
        age: Number(petForm.age), price: petForm.price ? Number(petForm.price) : 0, 
        location: petForm.location, description: petForm.description, 
        medical_history: petForm.medicalHistory, behavior: petForm.behavior, personality: petForm.personality
      });
      
      Alert.alert('Success!', 'Pet listed for adoption.');
      setPetForm({ category: 'Dog', petName: '', breed: '', age: '', price: '', location: '', description: '', medicalHistory: '', behavior: '', personality: '' });
      setLocationQuery('');
      setSelectedImage(null);
      setActiveTab('home'); // [DASHBOARD-REDESIGN]
    } catch (e: any) { Alert.alert('Error', e.message); } 
    finally { setIsSubmitting(false); }
  };

  const getBreedOptions = () => {
    if (petForm.category === 'Dog') return DOG_BREEDS;
    if (petForm.category === 'Cat') return CAT_BREEDS;
    return ['Mixed/Other'];
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        
        {/* [DASHBOARD-REDESIGN] */}
        {activeTab === 'home' && <View style={styles.tabContent}><DashboardScreen navigation={navigation} /></View>}
        {activeTab === 'saved' && <View style={styles.tabContent}><SavedPetsScreen navigation={navigation} /></View>}

        {activeTab === 'add' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={[styles.scrollTabContent, { paddingBottom: 110 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Post</Text>
              
              <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity style={[styles.toggleBtn, postType === 'general' && { backgroundColor: colors.primary }]} onPress={() => setPostType('general')}>
                  <Text style={[styles.toggleText, { color: postType === 'general' ? '#FFF' : colors.textPrimary }]}>General Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, postType === 'adoption' && { backgroundColor: colors.primary }]} onPress={() => setPostType('adoption')}>
                  <Text style={[styles.toggleText, { color: postType === 'adoption' ? '#FFF' : colors.textPrimary }]}>Adoption Listing</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={[styles.imagePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickImage}>
                {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.previewImage} /> : <View style={styles.imagePlaceholder}><Ionicons name="camera-outline" size={40} color={colors.textSecondary} /><Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 8 }]}>Tap to add a photo</Text></View>}
              </TouchableOpacity>

              {postType === 'general' && (
                <View>
                  <CustomInput label="Caption" placeholder="What's on your mind?" value={generalDesc} onChangeText={setGeneralDesc} multiline />
                  <PrimaryButton title="Share to Feed" onPress={handleSubmitGeneralPost} loading={isSubmitting} />
                </View>
              )}

              {postType === 'adoption' && (
                <View>
                  <CustomDropdown label="Pet Category *" value={petForm.category} options={CATEGORIES} onSelect={(val) => setPetForm({...petForm, category: val, breed: ''})} />
                  <CustomInput label="Pet Name *" placeholder="e.g., Buddy" value={petForm.petName} onChangeText={t => setPetForm({...petForm, petName: t})} />
                  <CustomDropdown label="Breed *" value={petForm.breed} options={getBreedOptions()} onSelect={(val) => setPetForm({...petForm, breed: val})} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 8 }}><CustomInput label="Age (Years) *" placeholder="e.g., 2" value={petForm.age} onChangeText={t => setPetForm({...petForm, age: t})} keyboardType="numeric" /></View>
                    <View style={{ flex: 1, marginLeft: 8 }}><CustomInput label="Price (PHP)" placeholder="Leave blank if free" value={petForm.price} onChangeText={t => setPetForm({...petForm, price: t})} keyboardType="numeric" /></View>
                  </View>

                  <View style={styles.autocompleteContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Location (City/Municipality) *</Text>
                    <TextInput 
                      style={[styles.autocompleteInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                      placeholder="Start typing a Philippine city..."
                      placeholderTextColor={colors.textSecondary}
                      value={locationQuery}
                      onChangeText={fetchLocations}
                    />
                    {showLocationList && (
                      <View style={[styles.autocompleteList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {isFetchingLocations ? (
                          <ActivityIndicator style={{ padding: 10 }} color={colors.primary} />
                        ) : locationResults.length > 0 ? (
                          locationResults.map((loc, index) => {
                            const provName = loc.provinceCode ? provincesMap[loc.provinceCode] : 'Metro Manila';
                            return (
                              <TouchableOpacity key={index} style={[styles.autocompleteItem, { borderBottomColor: colors.border }]} onPress={() => selectLocation(loc)}>
                                <Text style={{ color: colors.textPrimary, fontFamily: 'DMSans_400Regular' }}>{loc.name}, {provName}</Text>
                              </TouchableOpacity>
                            )
                          })
                        ) : (
                          <Text style={{ padding: 10, color: colors.textSecondary }}>No cities found</Text>
                        )}
                      </View>
                    )}
                  </View>

                  <CustomInput label="About / Description" placeholder="Describe the pet..." value={petForm.description} onChangeText={t => setPetForm({...petForm, description: t})} multiline />
                  
                  <CustomDropdown label="Medical History" value={petForm.medicalHistory} options={MEDICAL_HISTORY} onSelect={(val) => setPetForm({...petForm, medicalHistory: val})} />
                  <CustomDropdown label="Behavior" value={petForm.behavior} options={BEHAVIORS} onSelect={(val) => setPetForm({...petForm, behavior: val})} />
                  <CustomDropdown label="Personality" value={petForm.personality} options={PERSONALITIES} onSelect={(val) => setPetForm({...petForm, personality: val})} />
                  
                  <View style={{ marginBottom: 32, marginTop: 16 }}>
                    <PrimaryButton title="Post for Adoption" onPress={handleSubmitAdoptionPost} loading={isSubmitting} />
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* --- MESSAGES TAB (CLEAN 2-LINER) --- */}
        {activeTab === 'messages' && (
          <View style={[styles.tabContent, { paddingHorizontal: 0 }]}>
            <PetChatsScreen navigation={navigation} />
          </View>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && <ProfileScreen navigation={navigation} handleSignOut={handleSignOut} />}

      </View>
      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabChange} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentContainer: { flex: 1 },
  tabContent: { flex: 1, paddingTop: 16 },
  scrollTabContent: { paddingHorizontal: 16, paddingTop: 16 },
  headerTitle: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 16, paddingHorizontal: 16 },
  subtitle: { fontSize: 16, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
  toggleContainer: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  toggleText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  imagePickerContainer: { height: 250, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginBottom: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  
  // Location Autocomplete Styles
  autocompleteContainer: { marginBottom: 16, position: 'relative', zIndex: 10 },
  inputLabel: { fontSize: 14, fontFamily: 'DMSans_700Bold', marginBottom: 8 },
  autocompleteInput: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontFamily: 'DMSans_400Regular' },
  autocompleteList: { position: 'absolute', top: 75, left: 0, right: 0, borderWidth: 1, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, zIndex: 100 },
  autocompleteItem: { padding: 14, borderBottomWidth: 1 },
});