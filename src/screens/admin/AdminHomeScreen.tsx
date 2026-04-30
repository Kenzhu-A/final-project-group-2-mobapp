import React, { useState, useCallback } from 'react';
import { View, StyleSheet, BackHandler, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

import AdminBottomNavBar from '../../components/AdminBottomNavBar';
import AdminDashboardScreen from './AdminDashboardScreen';
import AdminAnnouncementsScreen from './AdminAnnouncementsScreen';
import AdminMessagesScreen from './AdminMessagesScreen'; // [ADMIN-MESSAGES]
import AdminProfileScreen from './AdminProfileScreen'; // [ADMIN] separate admin profile

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AdminHomeScreen({ navigation }: any) {
  const { colors, resetTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard'); 

  useFocusEffect(useCallback(() => { 
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true); 
    return () => sub.remove(); 
  }, []));

  const handleTabChange = (tab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userRole');
    await resetTheme();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.contentContainer}>
        
        {activeTab === 'dashboard' && <AdminDashboardScreen />}
        {activeTab === 'announcements' && <AdminAnnouncementsScreen />}
        {activeTab === 'messages' && <AdminMessagesScreen />}
        {activeTab === 'profile' && <AdminProfileScreen navigation={navigation} handleSignOut={handleSignOut} />}

      </View>
      <AdminBottomNavBar activeTab={activeTab} setActiveTab={handleTabChange} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentContainer: { flex: 1 },
});