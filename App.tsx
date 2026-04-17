import React, { useState, useMemo, createContext } from 'react';
import { Platform, StatusBar as RNStatusBar, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native'; // <-- Required for navigation

import AuthNavigator from './src/navigation/AuthNavigator';
import MainAppScreen from './src/screens/MainAppScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// 1. Create a global Auth Context to manage state from any screen
export const AuthContext = createContext({
  signIn: () => {},
  signOut: () => {},
});

const AppContainer = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { colors, isDarkMode } = useTheme();

  // 2. Define the context actions
  const authContext = useMemo(
    () => ({
      signIn: () => setIsAuthenticated(true),
      signOut: () => setIsAuthenticated(false),
    }),
    []
  );

  return (
    <AuthContext.Provider value={authContext}>
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0, backgroundColor: colors.background }}>
        
        {/* 3. Wrap screens in NavigationContainer */}
        <NavigationContainer>
          {!isAuthenticated ? (
            <AuthNavigator />
          ) : (
            <MainAppScreen /> 
          )}
        </NavigationContainer>

        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      </SafeAreaView>
    </AuthContext.Provider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContainer />
    </ThemeProvider>
  );
}