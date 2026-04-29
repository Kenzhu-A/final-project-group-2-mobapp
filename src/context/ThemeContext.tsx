import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  background: '#F1EFE8', // Parchment — page background
  surface:     '#FFFFFF',
  textPrimary: '#444441', // Charcoal — body text
  textSecondary: '#6C757D',
  primary: '#1D9E75',    // Rescue green — primary CTA
  accent:  '#D85A30',    // Warm coral — highlights & accent
  border:  '#dddddd',
};

export const darkTheme = {
  background: '#121212',
  surface:    '#1E1E1E',
  textPrimary: '#F1EFE8',
  textSecondary: '#ADB5BD',
  primary: '#1D9E75',  // Rescue green
  accent:  '#D85A30',  // Warm coral
  border:  '#343A40',
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