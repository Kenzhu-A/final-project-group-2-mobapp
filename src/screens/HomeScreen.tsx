import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import BottomNavBar from '../components/BottomNavBar';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';

import ProfileScreen from './ProfileScreen';
import PetFeedScreen from './PetFeedScreen'; 
import PetAdoptScreen from './PetAdoptScreen'; 

import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function HomeScreen({ navigation }: any) {
  const { colors, resetTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('feed'); 
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [postType, setPostType] = useState<'general' | 'adoption'>('general');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [generalDesc, setGeneralDesc] = useState('');
  const [petForm, setPetForm] = useState({ 
    petName: '', breed: '', age: '', location: '', description: '', medicalHistory: '', behavior: '', personality: '' 
  });

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; 
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab === 'messages') {
        setLoadingUsers(true);
        try {
          const storedUserId = await AsyncStorage.getItem('userId');
          setCurrentUserId(storedUserId);
          if (storedUserId) {
            const data = await api.getUsers(storedUserId);
            setUsers(data);
          }
        } catch (e) { 
          console.error("Fetch users error:", e); 
        } finally {
          setLoadingUsers(false);
        }
      }
    };
    fetchUsers();
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('userId');
    await resetTheme();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // FIXED WARNING
      allowsEditing: true,
      aspect: postType === 'general' ? [1, 1] : [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImageIfSelected = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    const filename = selectedImage.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;

    const formData = new FormData();
    formData.append('post_image', { uri: selectedImage, name: filename, type } as any);
    return await api.uploadPostImage(formData);
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
      setGeneralDesc(''); setSelectedImage(null); setActiveTab('feed');
    } catch (e: any) { Alert.alert('Error', e.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleSubmitAdoptionPost = async () => {
    if (!petForm.petName || !petForm.location) {
      Alert.alert('Missing Details', 'Please fill in at least the pet name and location.');
      return;
    }
    setIsSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const uploadedImageUrl = await uploadImageIfSelected();

      await api.createPetPost({
        owner_id: userId, image_url: uploadedImageUrl,
        pet_name: petForm.petName, breed: petForm.breed, age: petForm.age, location: petForm.location, 
        description: petForm.description, medical_history: petForm.medicalHistory, behavior: petForm.behavior, personality: petForm.personality
      });
      
      Alert.alert('Success!', 'Pet listed for adoption.');
      setPetForm({ petName: '', breed: '', age: '', location: '', description: '', medicalHistory: '', behavior: '', personality: '' });
      setSelectedImage(null); setActiveTab('adopt'); 
    } catch (e: any) { Alert.alert('Error', e.message); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        
        {activeTab === 'feed' && <View style={styles.tabContent}><PetFeedScreen navigation={navigation} /></View>}
        {activeTab === 'adopt' && <View style={styles.tabContent}><PetAdoptScreen navigation={navigation} /></View>}

        {activeTab === 'add' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={[styles.scrollTabContent, { paddingBottom: 110 }]} showsVerticalScrollIndicator={false}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Post</Text>
              
              <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, postType === 'general' && { backgroundColor: colors.primary }]} 
                  onPress={() => setPostType('general')}
                >
                  <Text style={[styles.toggleText, { color: postType === 'general' ? '#FFF' : colors.textPrimary }]}>General Post</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, postType === 'adoption' && { backgroundColor: colors.primary }]} 
                  onPress={() => setPostType('adoption')}
                >
                  <Text style={[styles.toggleText, { color: postType === 'adoption' ? '#FFF' : colors.textPrimary }]}>Adoption Listing</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={[styles.imagePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickImage}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={40} color={colors.textSecondary} />
                    <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 8 }]}>Tap to add a photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              {postType === 'general' && (
                <View>
                  <CustomInput label="Caption" placeholder="What's on your mind?" value={generalDesc} onChangeText={setGeneralDesc} multiline />
                  <PrimaryButton title="Share to Feed" onPress={handleSubmitGeneralPost} loading={isSubmitting} />
                </View>
              )}

              {postType === 'adoption' && (
                <View>
                  <CustomInput label="Pet Name *" placeholder="e.g., Buddy" value={petForm.petName} onChangeText={t => setPetForm({...petForm, petName: t})} />
                  <CustomInput label="Breed" placeholder="e.g., Golden Retriever" value={petForm.breed} onChangeText={t => setPetForm({...petForm, breed: t})} />
                  <CustomInput label="Age" placeholder="e.g., 2 years" value={petForm.age} onChangeText={t => setPetForm({...petForm, age: t})} />
                  <CustomInput label="Location *" placeholder="e.g., Santa Rosa, Laguna" value={petForm.location} onChangeText={t => setPetForm({...petForm, location: t})} />
                  <CustomInput label="About / Description" placeholder="Describe the pet..." value={petForm.description} onChangeText={t => setPetForm({...petForm, description: t})} multiline />
                  <CustomInput label="Medical History" placeholder="Vaccinated? Neutered?" value={petForm.medicalHistory} onChangeText={t => setPetForm({...petForm, medicalHistory: t})} multiline />
                  <CustomInput label="Behavior" placeholder="Good with kids? Playful?" value={petForm.behavior} onChangeText={t => setPetForm({...petForm, behavior: t})} multiline />
                  <CustomInput label="Personality" placeholder="Energetic? Shy?" value={petForm.personality} onChangeText={t => setPetForm({...petForm, personality: t})} multiline />
                  <View style={{ marginBottom: 32, marginTop: 16 }}>
                    <PrimaryButton title="Post for Adoption" onPress={handleSubmitAdoptionPost} loading={isSubmitting} />
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {activeTab === 'messages' && (
          <View style={[styles.tabContent, { paddingHorizontal: 16 }]}>
             <Text style={[styles.headerTitle, { color: colors.textPrimary, paddingHorizontal: 0 }]}>Messages</Text>
             {loadingUsers ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={{color: colors.textSecondary, textAlign: 'center', marginTop: 20}}>No users found to message.</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('ChatScreen', { receiverId: item.id, receiverName: item.full_name || item.email, senderId: currentUserId })}
                  >
                    <View style={styles.avatarPlaceholder}><Ionicons name="person" size={24} color="#FFF" /></View>
                    <View>
                      <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.full_name || 'Anonymous User'}</Text>
                      <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <ProfileScreen navigation={navigation} handleSignOut={handleSignOut} />
        )}
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
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F26419', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  userName: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  userEmail: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
});