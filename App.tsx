import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from './src/context/ThemeContext';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import ChatScreen from './src/screens/ChatScreen';

import AddNewUsersMessages from './src/screens/AddNewUsersMessagesScreen';
import ChatNotifications from './src/screens/ChatNotificationsScreen';

import MyPostsScreen from './src/screens/MyPostsScreen';
import SavedPostsScreen from './src/screens/SavedPostsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import ChangeForgotPasswordScreen from './src/screens/ChangeForgotPasswordScreen';
import MyListingsScreen from './src/screens/MyListingsScreen';
import LikedPostsScreen from './src/screens/LikedPostsScreen';
import MyPetsScreen from './src/screens/MyPetsScreen';
import PetDetailsScreen from './src/screens/PetDetailsScreen';
import LostAndFoundScreen from './src/screens/LostAndFoundScreen';

import AdminHomeScreen from './src/screens/admin/AdminHomeScreen';
import AdminPostsScreen from './src/screens/admin/AdminPostsScreen';
import AdminLogsScreen from './src/screens/admin/AdminLogsScreen';

// We import the config just to initialize it on app start
import './src/utils/notifications'; 

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
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
            <Stack.Screen name="SavedPostsScreen" component={SavedPostsScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="ChangeForgotPasswordScreen" component={ChangeForgotPasswordScreen} />
            <Stack.Screen name="MyListingsScreen" component={MyListingsScreen} />
            <Stack.Screen name="LikedPostsScreen" component={LikedPostsScreen} />
            <Stack.Screen name="MyPetsScreen" component={MyPetsScreen} />
            <Stack.Screen name="LostAndFoundScreen" component={LostAndFoundScreen} />
            <Stack.Screen name="PetDetailsScreen" component={PetDetailsScreen} />
            <Stack.Screen name="AddNewUsersMessages" component={AddNewUsersMessages} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="ChatNotifications" component={ChatNotifications} options={{ headerShown: false }} />
          
            <Stack.Screen name="AdminHomeScreen" component={AdminHomeScreen} />
            <Stack.Screen name="AdminPostsScreen" component={AdminPostsScreen} />
            <Stack.Screen name="AdminLogsScreen" component={AdminLogsScreen} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}