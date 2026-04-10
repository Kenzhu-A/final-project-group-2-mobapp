// App.tsx
import React, { useState } from 'react';
import { Platform, StatusBar as RNStatusBar, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AuthScreen from './src/screens/AuthScreen';
import MainAppScreen from './src/screens/MainAppScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Create a wrapper component to consume the theme for the SafeAreaView background
const AppContainer = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { colors, isDarkMode } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0, backgroundColor: colors.background }}>
      {!isAuthenticated ? (
        <AuthScreen onAuthenticate={() => setIsAuthenticated(true)} />
      ) : (
        <MainAppScreen onLogout={() => setIsAuthenticated(false)} />
      )}
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContainer />
    </ThemeProvider>
  );
}