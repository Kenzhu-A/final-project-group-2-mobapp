import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';

// --- RESTORED FORGOT PASSWORD FLOW SCREENS ---
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{ 
          headerShown: false,
          animation: 'fade', 
          gestureEnabled: false 
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        
        {/* ADDED THESE BACK SO THE NAVIGATION LINK WORKS */}
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}