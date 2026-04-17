import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, BackHandler, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import BottomNavBar from '../components/BottomNavBar';
import { theme } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('home');

  // STRICT: Disable Android Hardware Back Button to prevent returning to Login
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; 
      
      // Store the subscription object returned by addEventListener
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
      // Call .remove() on the subscription during cleanup
      return () => subscription.remove();
    }, [])
  );

  const handleTabChange = (tab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  // The dynamic background requirement based on active tab
  const getBackgroundColor = () => {
    return activeTab === 'home' ? theme.colors.primary : theme.colors.background;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getBackgroundColor() }]}>
      
      {/* Content Area */}
      <View style={[styles.contentContainer, { backgroundColor: getBackgroundColor() }]}>
        <Text style={[styles.demoText, activeTab === 'home' && { color: '#FFF' }]}>
          Current View: {activeTab.toUpperCase()}
        </Text>
      </View>

      {/* Persistent 5-Button Bottom Nav */}
      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabChange} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  demoText: { fontSize: 24, fontFamily: theme.typography.headingFont, color: theme.colors.textDark },
});