import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  primary: '#F26419',
  border: '#E9ECEF',
};

export const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  textPrimary: '#F8F9FA',
  textSecondary: '#ADB5BD',
  primary: '#F26419',
  border: '#343A40',
};

type ThemeType = typeof lightTheme;

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  resetTheme: () => void; // <-- NEW
  colors: ThemeType;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  // Load saved preference on app start
  useEffect(() => {
    AsyncStorage.getItem('theme').then(saved => {
        if (saved === 'dark') setIsDarkMode(true);
        else if (saved === 'light') setIsDarkMode(false);
    });
  }, []);

  const toggleTheme = async () => {
    setIsDarkMode((prev) => {
       const newMode = !prev;
       AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
       return newMode;
    });
  };

  // --- NEW: Resets to light mode and clears memory ---
  const resetTheme = async () => {
    setIsDarkMode(false);
    await AsyncStorage.removeItem('theme'); 
  };

  const colors = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, resetTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};