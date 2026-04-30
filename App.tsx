import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications'; // [PUSH-NOTIF]
import AsyncStorage from '@react-native-async-storage/async-storage'; // [PUSH-NOTIF]

import { ThemeProvider } from './src/context/ThemeContext';
import { SavedPetsProvider } from './src/hooks/useSavedPets'; // [SAVED-PETS]
import { api } from './src/services/api'; // [PUSH-NOTIF]
import { registerForPushNotificationsAsync } from './src/utils/notifications'; // [PUSH-NOTIF]

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import ChatScreen from './src/screens/ChatScreen';

import AddNewUsersMessages from './src/screens/AddNewUsersMessagesScreen';
import ChatNotifications from './src/screens/ChatNotificationsScreen';

import MyPostsScreen from './src/screens/MyPostsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import ChangeForgotPasswordScreen from './src/screens/ChangeForgotPasswordScreen';
import MyListingsScreen from './src/screens/MyListingsScreen';
import MyPetsScreen from './src/screens/MyPetsScreen';
import LostAndFoundScreen from './src/screens/LostAndFoundScreen';
import PetDetailsScreen from './src/screens/PetDetailsScreen';

// [DASHBOARD-REDESIGN] new screens
import FilterScreen from './src/screens/FilterScreen';
import EditPetPostScreen from './src/screens/EditPetPostScreen'; // [PET-EDIT]
import DeletePetPostScreen from './src/screens/DeletePetPostScreen'; // [DELETE-CONFIRM]
import LikedPetsAndPostsScreen from './src/screens/LikedPetsAndPostsScreen'; // [LIKED-POSTS]
import AllPetsScreen from './src/screens/AllPetsScreen'; // [DASHBOARD-REDESIGN]
import ViewUserProfileScreen from './src/screens/ViewUserProfileScreen'; // [DASHBOARD-REDESIGN]

import AdminHomeScreen from './src/screens/admin/AdminHomeScreen';
import AdminPostsScreen from './src/screens/admin/AdminPostsScreen';
import AdminLogsScreen from './src/screens/admin/AdminLogsScreen';
import AdminUserConversationsScreen from './src/screens/admin/AdminUserConversationsScreen'; // [ADMIN-MESSAGES]
import AdminMessageThreadScreen from './src/screens/admin/AdminMessageThreadScreen'; // [ADMIN-MESSAGES]
import AdminUsersScreen from './src/screens/admin/AdminUsersScreen'; // [ADMIN]
import AdminLostFoundModerationScreen from './src/screens/admin/AdminLostFoundModerationScreen'; // [ADMIN]
import AdminPetsScreen from './src/screens/admin/AdminPetsScreen'; // [ADMIN]
import AdminReportsScreen from './src/screens/admin/AdminReportsScreen'; // [REPORTS]

// Initializes Notifications.setNotificationHandler on import
import './src/utils/notifications';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_700Bold,
  });
  const navigationRef = useRef<any>(null); // [PUSH-NOTIF]

  // [PUSH-NOTIF] register device push token with backend on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        const userId = await AsyncStorage.getItem('userId');
        if (token && userId) await api.registerPushToken(userId, token);
      } catch (e) {
        console.warn('[PUSH-NOTIF] token registration skipped:', (e as any)?.message);
      }
    })();
  }, []);

  // [PUSH-NOTIF] route notification taps by data.type
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      const nav = navigationRef.current;
      if (!nav || !data?.type) return;
      if (data.type === 'pet_adopted' && data.petId) {
        nav.navigate('PetDetailsScreen', { petId: data.petId });
      } else if (data.type === 'new_message' && data.senderId) {
        nav.navigate('ChatScreen', {
          receiverId: data.senderId,
          receiverName: data.senderName || 'User',
          senderId: undefined,
        });
      }
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <SavedPetsProvider>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: false }}
            >
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
              <Stack.Screen name="ChatScreen" component={ChatScreen} />

              <Stack.Screen name="MyPostsScreen" component={MyPostsScreen} />
              <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
              <Stack.Screen name="ChangeForgotPasswordScreen" component={ChangeForgotPasswordScreen} />
              <Stack.Screen name="MyListingsScreen" component={MyListingsScreen} />
              <Stack.Screen name="MyPetsScreen" component={MyPetsScreen} />
              <Stack.Screen name="LostAndFoundScreen" component={LostAndFoundScreen} />
              <Stack.Screen name="PetDetailsScreen" component={PetDetailsScreen} />
              <Stack.Screen name="AddNewUsersMessages" component={AddNewUsersMessages} options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="ChatNotifications" component={ChatNotifications} options={{ headerShown: false }} />

              {/* [DASHBOARD-REDESIGN] new routes */}
              <Stack.Screen name="FilterScreen" component={FilterScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="EditPetPostScreen" component={EditPetPostScreen} />
              <Stack.Screen name="DeletePetPostScreen" component={DeletePetPostScreen} />
              <Stack.Screen name="LikedPetsAndPostsScreen" component={LikedPetsAndPostsScreen} />
              <Stack.Screen name="AllPetsScreen" component={AllPetsScreen} />
              <Stack.Screen name="ViewUserProfileScreen" component={ViewUserProfileScreen} />

              <Stack.Screen name="AdminHomeScreen" component={AdminHomeScreen} />
              <Stack.Screen name="AdminPostsScreen" component={AdminPostsScreen} />
              <Stack.Screen name="AdminLogsScreen" component={AdminLogsScreen} />
              <Stack.Screen name="AdminUserConversationsScreen" component={AdminUserConversationsScreen} />
              <Stack.Screen name="AdminMessageThreadScreen" component={AdminMessageThreadScreen} />
              <Stack.Screen name="AdminUsersScreen" component={AdminUsersScreen} />
              <Stack.Screen name="AdminLostFoundModerationScreen" component={AdminLostFoundModerationScreen} />
              <Stack.Screen name="AdminPetsScreen" component={AdminPetsScreen} />
              <Stack.Screen name="AdminReportsScreen" component={AdminReportsScreen} />
            </Stack.Navigator>
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaProvider>
      </SavedPetsProvider>
    </ThemeProvider>
  );
}