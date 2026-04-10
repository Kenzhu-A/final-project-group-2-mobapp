// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// Define our color palettes
export const lightTheme = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  primary: '#F26419', // SnoutScout Orange
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
  colors: ThemeType;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Use device preference as default
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const colors = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};