import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, BackHandler, LayoutAnimation, UIManager, Platform, Pressable, ActivityIndicator, Image, ScrollView, Alert, KeyboardAvoidingView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { io, Socket } from 'socket.io-client';

import BottomNavBar from '../components/BottomNavBar';
import CustomInput from '../components/CustomInput';
import CustomDropdown from '../components/CustomDropdown';
import PrimaryButton from '../components/PrimaryButton';
import { useImageUploader } from '../hooks/useImageUploader'; // [UPLOAD-PROGRESS]
import UploadingImageTile from '../components/UploadingImageTile'; // [UPLOAD-PROGRESS]

import ProfileScreen from './ProfileScreen';
import PetChatsScreen from './PetChatsScreen';
// [DASHBOARD-REDESIGN] new tab screens
import DashboardScreen from './DashboardScreen';
import SavedPetsScreen from './SavedPetsScreen';

import { useTheme } from '../context/ThemeContext';
import { api, BASE_URL } from '../services/api';
import { useSavedPets } from '../hooks/useSavedPets'; // [SAVED-PETS]
import { PET_NAME_MAX_LENGTH, sanitizePetName, validatePetName } from '../utils/petNameValidation'; // [PET-NAME-VALIDATION]

const SOCKET_URL = BASE_URL.replace('/api', '');
const CHAT_READ_KEY = 'snoutscout_chat_read_map';

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
// [DASHBOARD-REDESIGN] new fields
const GENDERS = ['Male', 'Female', 'Unknown'];
const SIZES_LIST = ['Small', 'Medium', 'Large'];
const TAGS_LIST = [
  'House-trained', 'Vaccinated', 'Good with kids', 'Good with other pets',
  'Neutered/Spayed', 'Energetic', 'Calm', 'Playful', 'Friendly', 'Vocal', 'Independent',
];

export default function HomeScreen({ navigation, route }: any) {
  const { colors, resetTheme } = useTheme();
  const { refresh: refreshSavedPets } = useSavedPets(); // [SAVED-PETS] re-scope to logged-in user on mount
  
  const [activeTab, setActiveTab] = useState('home'); // [DASHBOARD-REDESIGN]
  const [unreadMessageCount, setUnreadMessageCount] = useState(0); // [MESSAGE-BADGE]
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const requestedTab = route?.params?.initialTab;
    if (requestedTab === 'messages') {
      setActiveTab('messages');
      navigation.setParams?.({ initialTab: undefined });
    }
  }, [route?.params?.initialTab]);

  // --- POST CREATION STATE ---
  const [postType, setPostType] = useState<'general' | 'adoption'>('general');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [generalDesc, setGeneralDesc] = useState('');
  const [petForm, setPetForm] = useState({
    category: 'Dog', petName: '', breed: '', age: '', price: '', location: '', description: '',
    medicalHistory: '', behavior: '', personality: '',
    gender: 'Unknown', weightKg: '', size: 'Medium', tags: [] as string[], // [DASHBOARD-REDESIGN]
  });
  const [ageUnit, setAgeUnit] = useState('Years'); // [AGE-UNIT] Years or Months
  const petUploader = useImageUploader([]); // [UPLOAD-PROGRESS] multi-image for adoption form
  // [OTHER-CATEGORY] free-text input shown when user selects "Other" as pet category
  const [otherCategoryText, setOtherCategoryText] = useState('');

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

  // [SAVED-PETS] re-read userId and reload saved pets for the newly logged-in user
  useEffect(() => { refreshSavedPets(); }, []);

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

  useEffect(() => {
    // Clear uploaded photos when switching away from home tab
    if (activeTab !== 'home') {
      petUploader.clear();
    }
  }, [activeTab]);

  // [MESSAGING-FIX] Recalculate unread messages from backend + local read map instead of guessing.
  const refreshUnreadMessageCount = useCallback(async () => {
    const userId = userIdRef.current || await AsyncStorage.getItem('userId');
    if (!userId) return;
    userIdRef.current = userId;

    const readRaw = await AsyncStorage.getItem(CHAT_READ_KEY);
    const readMap = readRaw ? JSON.parse(readRaw) : {};
    const conversations = await api.getConversations(userId);
    const unreadCount = (conversations || []).filter((c: any) => {
      const latestTs = c.createdAt || c.created_at;
      const readTs = readMap[c.partnerId];
      return !readTs || new Date(latestTs).getTime() > new Date(readTs).getTime();
    }).length;
    setUnreadMessageCount(unreadCount);
  }, []);

  // [MESSAGE-BADGE] Set up real-time message badge
  useEffect(() => {
    const setupMessageBadge = async () => {
      const userId = await AsyncStorage.getItem('userId');
      userIdRef.current = userId;
      if (!userId) return;

      // Disconnect previous socket if any
      socketRef.current?.disconnect();

      const socket = io(SOCKET_URL);
      socketRef.current = socket;
      socket.emit('register', userId);

      try {
        await refreshUnreadMessageCount();
      } catch (err) {
        console.error('[MESSAGE-BADGE] Failed to refresh conversations:', err);
      }

      // Listen for incoming messages and update badge
      socket.on('receive_message', async (newMessage: any) => {
        if (newMessage.sender_id !== userId) {
          await refreshUnreadMessageCount(); // [MESSAGING-FIX]
        }
      });
    };

    setupMessageBadge();

    // Cleanup
    return () => {
      socketRef.current?.disconnect();
    };
  }, [refreshUnreadMessageCount]);

  const handleTabChange = (tab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  // [MESSAGE-BADGE] Callback to reset unread badge when entering ChatScreen
  const resetMessageBadge = useCallback(() => {
    refreshUnreadMessageCount().catch(() => {}); // [MESSAGING-FIX]
  }, [refreshUnreadMessageCount]);

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
    // [OTHER-CATEGORY] resolve the actual category before validation
    const resolvedCategory = petForm.category === 'Other' ? otherCategoryText.trim() : petForm.category;
    // [PET-NAME-VALIDATION] enforce real pet names before submitting to backend
    const petNameError = validatePetName(petForm.petName);
    if (petNameError) {
      Alert.alert('Invalid Pet Name', petNameError);
      return;
    }
    const cleanPetName = petForm.petName.trim();

    if (!petForm.location || !petForm.age || !resolvedCategory || !petForm.breed) {
      const msg = petForm.category === 'Other' && !otherCategoryText.trim()
        ? 'Please specify the pet type when selecting "Other" as category.'
        : 'Please fill in all required fields (Category, Name, Breed, Age, Location).';
      Alert.alert('Missing Details', msg);
      return;
    }
    if (isNaN(Number(petForm.age))) { Alert.alert('Invalid Age', 'Age must contain only numbers.'); return; }
    if (petForm.price && isNaN(Number(petForm.price))) { Alert.alert('Invalid Price', 'Price must contain only numbers.'); return; }
    if (petForm.weightKg && isNaN(Number(petForm.weightKg))) { Alert.alert('Invalid Weight', 'Weight must be a number.'); return; }
    if (petUploader.anyUploading) { Alert.alert('Photos still uploading', 'Please wait for all photos to finish uploading.'); return; } // [UPLOAD-PROGRESS]

    setIsSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      // [UPLOAD-PROGRESS] use multi-image uploader; first URL is the legacy cover
      const image_urls = petUploader.urls;
      const cover = image_urls[0] || null;

      await api.createPetPost({
        owner_id: userId, category: resolvedCategory,
        image_url: cover, image_urls,                // [DASHBOARD-REDESIGN]
        pet_name: cleanPetName, breed: petForm.breed, // [PET-NAME-VALIDATION]
        age: `${petForm.age} ${ageUnit}`, price: petForm.price ? Number(petForm.price) : 0,
        location: petForm.location, description: petForm.description,
        medical_history: petForm.medicalHistory, behavior: petForm.behavior, personality: petForm.personality,
        gender: petForm.gender.toLowerCase(),        // [DASHBOARD-REDESIGN]
        weight_kg: petForm.weightKg ? Number(petForm.weightKg) : null,
        size: petForm.size.toLowerCase(),
        tags: petForm.tags,
      });
      
      Alert.alert('Success!', 'Pet listed for adoption.');
      setPetForm({ category: 'Dog', petName: '', breed: '', age: '', price: '', location: '', description: '', medicalHistory: '', behavior: '', personality: '', gender: 'Unknown', weightKg: '', size: 'Medium', tags: [] }); // [DASHBOARD-REDESIGN]
      setOtherCategoryText(''); // [OTHER-CATEGORY]
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
        {activeTab === 'home' && <View style={styles.tabContent}><DashboardScreen navigation={navigation} onProfilePress={() => handleTabChange('profile')} /></View>}
        {activeTab === 'saved' && <View style={styles.tabContent}><SavedPetsScreen navigation={navigation} /></View>}

        {activeTab === 'add' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={[styles.scrollTabContent, { paddingBottom: 110 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Post</Text>
              
              <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Pressable style={[styles.toggleBtn, postType === 'general' && { backgroundColor: colors.primary }]} onPress={() => setPostType('general')}>
                  <Text style={[styles.toggleText, { color: postType === 'general' ? '#FFF' : colors.textPrimary }]}>General Post</Text>
                </Pressable>
                <Pressable style={[styles.toggleBtn, postType === 'adoption' && { backgroundColor: colors.primary }]} onPress={() => setPostType('adoption')}>
                  <Text style={[styles.toggleText, { color: postType === 'adoption' ? '#FFF' : colors.textPrimary }]}>Adoption Listing</Text>
                </Pressable>
              </View>
              
              {/* [UPLOAD-PROGRESS] adoption uses multi-image; general post keeps single picker */}
              {postType === 'adoption' ? (
                <View style={[styles.multiImageWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {petUploader.items.map((it) => (
                      <UploadingImageTile key={it.uri} item={it} onRemove={() => petUploader.remove(it.uri)} onRetry={() => petUploader.retry(it.uri)} />
                    ))}
                    {petUploader.items.length < petUploader.MAX_IMAGES && (
                      <Pressable onPress={petUploader.pick} style={[styles.addTile, { borderColor: colors.border }]}>
                        <Ionicons name="add" size={32} color={colors.textSecondary} />
                        <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', fontSize: 11, marginTop: 2 }}>Add photo</Text>
                      </Pressable>
                    )}
                  </View>
                  <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', fontSize: 12, marginTop: 4 }}>
                    {petUploader.items.length}/{petUploader.MAX_IMAGES} photos
                  </Text>
                </View>
              ) : (
                <Pressable style={[styles.imagePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickImage}>
                  {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.previewImage} /> : <View style={styles.imagePlaceholder}><Ionicons name="camera-outline" size={40} color={colors.textSecondary} /><Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 8 }]}>Tap to add a photo</Text></View>}
                </Pressable>
              )}

              {postType === 'general' && (
                <View>
                  <CustomInput label="Caption" placeholder="What's on your mind?" value={generalDesc} onChangeText={setGeneralDesc} multiline />
                  <PrimaryButton title="Share to Feed" onPress={handleSubmitGeneralPost} loading={isSubmitting} />
                </View>
              )}

              {postType === 'adoption' && (
                <View>
                  <CustomDropdown label="Pet Category *" value={petForm.category} options={CATEGORIES} onSelect={(val) => { setPetForm({...petForm, category: val, breed: ''}); if (val !== 'Other') setOtherCategoryText(''); }} />
                  {/* [OTHER-CATEGORY] show free-text field when Other is selected */}
                  {petForm.category === 'Other' && (
                    <CustomInput label="Specify Pet Type *" placeholder="e.g., Hamster, Turtle, Parrot" value={otherCategoryText} onChangeText={setOtherCategoryText} />
                  )}
                  <CustomInput
                    label="Pet Name *"
                    placeholder="e.g., Buddy"
                    value={petForm.petName}
                    onChangeText={t => setPetForm({ ...petForm, petName: sanitizePetName(t) })}
                    maxLength={PET_NAME_MAX_LENGTH}
                  />
                  <CustomDropdown label="Breed *" value={petForm.breed} options={getBreedOptions()} onSelect={(val) => setPetForm({...petForm, breed: val})} />
                  
                  {/* [AGE-UNIT] separate age number and unit dropdowns */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
                    <View style={{ flex: 1, marginRight: 8 }}><CustomInput label="Age *" placeholder="e.g., 2" value={petForm.age} onChangeText={t => setPetForm({...petForm, age: t})} keyboardType="numeric" /></View>
                    <View style={{ flex: 1, marginLeft: 8}}><CustomDropdown label="Unit" value={ageUnit} options={['Years', 'Months']} onSelect={(val) => setAgeUnit(val)} /></View>
                  </View>

                  <CustomInput label="Price (PHP)" placeholder="Leave blank if free" value={petForm.price} onChangeText={t => setPetForm({...petForm, price: t})} keyboardType="numeric" />

                  <View style={styles.autocompleteContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Location (City/Municipality) *</Text>
                    <TextInput 
                      style={[styles.autocompleteInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
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

                  <CustomInput label="About / Description" placeholder="Describe the pet..." value={petForm.description} onChangeText={t => setPetForm({...petForm, description: t})} multiline />
                  
                  <CustomDropdown label="Medical History" value={petForm.medicalHistory} options={MEDICAL_HISTORY} onSelect={(val) => setPetForm({...petForm, medicalHistory: val})} />
                  <CustomDropdown label="Behavior" value={petForm.behavior} options={BEHAVIORS} onSelect={(val) => setPetForm({...petForm, behavior: val})} />
                  <CustomDropdown label="Personality" value={petForm.personality} options={PERSONALITIES} onSelect={(val) => setPetForm({...petForm, personality: val})} />

                  {/* [DASHBOARD-REDESIGN] new adopter-relevant fields */}
                  <CustomDropdown label="Gender" value={petForm.gender} options={GENDERS} onSelect={(val) => setPetForm({...petForm, gender: val})} />
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <CustomInput label="Weight (kg)" placeholder="e.g., 12" value={petForm.weightKg} onChangeText={t => setPetForm({...petForm, weightKg: t})} keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <CustomDropdown label="Size" value={petForm.size} options={SIZES_LIST} onSelect={(val) => setPetForm({...petForm, size: val})} />
                    </View>
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.textPrimary, marginTop: 8, marginBottom: 8 }]}>Traits & tags</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                    {TAGS_LIST.map((tag) => {
                      const active = petForm.tags.includes(tag);
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => setPetForm({ ...petForm, tags: active ? petForm.tags.filter(t => t !== tag) : [...petForm.tags, tag] })}
                          style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent', marginRight: 8, marginBottom: 8 }}
                        >
                          <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontFamily: 'DMSans_700Bold', fontSize: 12 }}>{tag}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={{ marginBottom: 32, marginTop: 8 }}>
                    <PrimaryButton
                      title={petUploader.anyUploading ? 'Uploading photos…' : 'Post for Adoption'}
                      onPress={handleSubmitAdoptionPost}
                      loading={isSubmitting}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* --- MESSAGES TAB (CLEAN 2-LINER) --- */}
        {activeTab === 'messages' && (
          <View style={[styles.tabContent, { paddingHorizontal: 0 }]}>
            <PetChatsScreen navigation={navigation} onChatEnter={resetMessageBadge} />
          </View>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && <ProfileScreen navigation={navigation} handleSignOut={handleSignOut} setActiveTab={handleTabChange} />}

      </View>
      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabChange} unreadMessageCount={unreadMessageCount} />
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
  // [UPLOAD-PROGRESS]
  multiImageWrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  addTile: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 8 },
});