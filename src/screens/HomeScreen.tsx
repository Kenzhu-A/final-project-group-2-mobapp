import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, BackHandler, 
  LayoutAnimation, UIManager, Platform, FlatList, 
  TouchableOpacity, ActivityIndicator, Image, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

import BottomNavBar from '../components/BottomNavBar';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import ProfileScreen from './ProfileScreen'; // <-- 1. WE IMPORT THE NEW PROFILE SCREEN HERE
import { theme } from '../theme';
import { api } from '../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MOCK_POSTS = [
  { id: '1', petName: 'Buddy (Golden Retriever)', location: 'Santa Rosa, Laguna', time: '2 hours ago' },
  { id: '2', petName: 'Luna (Siamese Cat)', location: 'Biñan, Laguna', time: '5 hours ago' },
];

export default function HomeScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('home');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { isDarkMode, colors } = useTheme();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [petForm, setPetForm] = useState({ petName: '', breed: '', age: '', location: '', description: '' });

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
        const storedUserId = await AsyncStorage.getItem('userId');
        setCurrentUserId(storedUserId);
        if (storedUserId) {
          try {
            const data = await api.getUsers(storedUserId);
            setUsers(data);
          } catch (e) { console.error(e); }
        }
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('userId');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access gallery is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const currentBg = isDarkMode ? '#121212' : theme.colors.background;
  const currentCardBg = isDarkMode ? '#1E1E1E' : theme.colors.surface;
  const currentText = isDarkMode ? '#FFFFFF' : theme.colors.textDark;
  const currentSubtext = isDarkMode ? '#AAAAAA' : theme.colors.textLight;
  const currentBorder = isDarkMode ? '#333333' : theme.colors.border;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentBg }]} edges={['top']}>
      <View style={[styles.contentContainer, { backgroundColor: currentBg }]}>
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <View style={styles.tabContent}>
            <Text style={[styles.headerTitle, { color: currentText }]}>Adoption Feed</Text>
            <FlatList
              data={MOCK_POSTS}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 110 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[styles.postCard, { backgroundColor: currentCardBg, borderColor: currentBorder }]}>
                  <View style={styles.postImagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#FFF" />
                  </View>
                  <View style={styles.postDetails}>
                    <Text style={[styles.postTitle, { color: currentText }]}>{item.petName}</Text>
                    <Text style={[styles.postSubtitle, { color: currentSubtext }]}><Ionicons name="location-outline" /> {item.location}</Text>
                    <Text style={[styles.postTime, { color: currentSubtext }]}>{item.time}</Text>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="bookmark-outline" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        {/* TAB 2: MESSAGES */}
        {activeTab === 'messages' && (
          <View style={styles.tabContent}>
            <Text style={[styles.headerTitle, { color: currentText }]}>Messages</Text>
            {loadingUsers ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.userCard, { backgroundColor: currentCardBg, borderColor: currentBorder }]}
                    onPress={() => navigation.navigate('ChatScreen', { 
                      receiverId: item.id, receiverName: item.full_name || item.email, senderId: currentUserId
                    })}
                  >
                    <View style={styles.avatarPlaceholder}><Ionicons name="person" size={24} color="#FFF" /></View>
                    <View>
                      <Text style={[styles.userName, { color: currentText }]}>{item.full_name || 'Anonymous User'}</Text>
                      <Text style={[styles.userEmail, { color: currentSubtext }]}>{item.email}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* TAB 3: ADD POST */}
        {activeTab === 'add' && (
          <ScrollView contentContainerStyle={[styles.scrollTabContent, { paddingBottom: 110 }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.headerTitle, { color: currentText }]}>Create New Post</Text>
            <TouchableOpacity style={[styles.imagePickerContainer, { backgroundColor: currentCardBg, borderColor: currentBorder }]} onPress={pickImage}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={currentSubtext} />
                  <Text style={[styles.subtitle, { color: currentSubtext, marginTop: 8 }]}>Tap to upload a photo</Text>
                </View>
              )}
            </TouchableOpacity>
            <CustomInput label="Pet Name" placeholder="e.g., Buddy" value={petForm.petName} onChangeText={t => setPetForm({...petForm, petName: t})} />
            <CustomInput label="Breed" placeholder="e.g., Golden Retriever" value={petForm.breed} onChangeText={t => setPetForm({...petForm, breed: t})} />
            <CustomInput label="Age" placeholder="e.g., 2 years" value={petForm.age} onChangeText={t => setPetForm({...petForm, age: t})} />
            <CustomInput label="Location" placeholder="e.g., Santa Rosa, Laguna" value={petForm.location} onChangeText={t => setPetForm({...petForm, location: t})} />
            <View style={{ marginBottom: theme.spacing.xl, marginTop: theme.spacing.m }}>
              <PrimaryButton title="Post for Adoption" onPress={() => console.log("Submit Post:", petForm, selectedImage)} />
            </View>
          </ScrollView>
        )}

        {/* TAB 4: SAVED POSTS */}
        {activeTab === 'saved' && (
          <View style={styles.tabContent}>
            <Text style={[styles.headerTitle, { color: currentText }]}>Saved Pets</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.postCard, { backgroundColor: currentCardBg, borderColor: currentBorder }]}>
                <View style={styles.postImagePlaceholder}><Ionicons name="image-outline" size={40} color="#FFF" /></View>
                <View style={styles.postDetails}>
                  <Text style={[styles.postTitle, { color: currentText }]}>{MOCK_POSTS[0].petName}</Text>
                  <Text style={[styles.postSubtitle, { color: currentSubtext }]}><Ionicons name="location-outline" /> {MOCK_POSTS[0].location}</Text>
                </View>
                <Ionicons name="bookmark" size={24} color={theme.colors.primary} />
              </View>
            </ScrollView>
          </View>
        )}

        {/* TAB 5: PROFILE (REPLACED WITH THE NEW COMPONENT) */}
        {activeTab === 'profile' && (
          <ProfileScreen 
            navigation={navigation} 
            isDarkMode={isDarkMode} 
            handleSignOut={handleSignOut} 
          />
        )}

      </View>
      
      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabChange} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentContainer: { flex: 1 },
  tabContent: { flex: 1, paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.m },
  scrollTabContent: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.m },
  headerTitle: { fontSize: 28, fontFamily: theme.typography.headingFont, marginBottom: theme.spacing.m },
  subtitle: { fontSize: 16, fontFamily: theme.typography.bodyFont, textAlign: 'center' },
  postCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  postImagePlaceholder: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  postDetails: { flex: 1 },
  postTitle: { fontSize: 16, fontFamily: theme.typography.bodyFontBold },
  postSubtitle: { fontSize: 13, fontFamily: theme.typography.bodyFont, marginTop: 4 },
  postTime: { fontSize: 11, fontFamily: theme.typography.bodyFont, marginTop: 4 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  userName: { fontSize: 16, fontFamily: theme.typography.bodyFontBold },
  userEmail: { fontSize: 13, fontFamily: theme.typography.bodyFont, marginTop: 2 },
  imagePickerContainer: { height: 200, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginBottom: theme.spacing.m, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
});