import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, BackHandler, 
  LayoutAnimation, UIManager, Platform, FlatList, 
  TouchableOpacity, ActivityIndicator 
} from 'react-native'; // <-- REMOVED SafeAreaView from here
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- ADDED HERE
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../components/BottomNavBar';
import { theme } from '../theme';
import { api } from '../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('home');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; 
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Load the current user ID and fetch other users when switching to 'messages' tab
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

  const getBackgroundColor = () => activeTab === 'home' ? theme.colors.primary : theme.colors.background;

  // --- SIGN OUT LOGIC ---
  const handleSignOut = async () => {
    // 1. Clear the saved user ID from the phone's memory
    await AsyncStorage.removeItem('userId');
    
    // 2. Reset the navigation stack so they can't swipe back into the app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getBackgroundColor() }]}>
      <View style={[styles.contentContainer, { backgroundColor: getBackgroundColor() }]}>
        
        {/* Placeholder for Home, Search, Add, Alerts Tabs */}
        {activeTab !== 'messages' && activeTab !== 'profile' && (
          <Text style={[styles.demoText, activeTab === 'home' && { color: '#FFF' }]}>
            Current View: {activeTab.toUpperCase()}
          </Text>
        )}

        {/* TAB 4: Messages Tab */}
        {activeTab === 'messages' && (
          <View style={styles.messagesContainer}>
            <Text style={styles.headerTitle}>Start a Chat</Text>
            {loadingUsers ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.userCard}
                    onPress={() => navigation.navigate('ChatScreen', { 
                      receiverId: item.id, 
                      receiverName: item.full_name || item.email,
                      senderId: currentUserId
                    })}
                  >
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#FFF" />
                    </View>
                    <View>
                      <Text style={styles.userName}>{item.full_name || 'Anonymous User'}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* TAB 5: Profile Tab (with mini Sign Out button) */}
        {activeTab === 'profile' && (
          <View style={styles.profileContainer}>
            <Text style={styles.headerTitle}>My Profile</Text>
            
            <View style={styles.profileCard}>
              <Ionicons name="person-circle-outline" size={80} color={theme.colors.textLight} />
              <Text style={styles.profileTagline}>Manage your account settings</Text>
              
              <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>
      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabChange} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentContainer: { flex: 1 },
  demoText: { fontSize: 24, fontFamily: theme.typography.headingFont, color: theme.colors.textDark, textAlign: 'center', marginTop: 100 },
  
  // Messages Tab Styles
  messagesContainer: { flex: 1, padding: theme.spacing.m },
  headerTitle: { fontSize: 28, fontFamily: theme.typography.headingFont, color: theme.colors.textDark, marginBottom: theme.spacing.m },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  userName: { fontSize: 16, fontFamily: theme.typography.bodyFontBold, color: theme.colors.textDark },
  userEmail: { fontSize: 13, fontFamily: theme.typography.bodyFont, color: theme.colors.textLight, marginTop: 2 },

  // Profile Tab Styles
  profileContainer: { flex: 1, padding: theme.spacing.m },
  profileCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: theme.spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, marginTop: theme.spacing.m },
  profileTagline: { fontSize: 14, fontFamily: theme.typography.bodyFont, color: theme.colors.textLight, marginTop: 8, marginBottom: 24 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDECEA', paddingVertical: 12, paddingHorizontal: 24, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.error },
  logoutText: { fontSize: 16, fontFamily: theme.typography.bodyFontBold, color: theme.colors.error },
});