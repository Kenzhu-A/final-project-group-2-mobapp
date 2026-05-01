import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function ChangeForgotPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Strictly disable the Android hardware back button so they can't go back to the OTP screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; 
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match!');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }
    
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Session Expired', 'Please request a new OTP.');
        navigation.replace('Login');
        return;
      }
      
      // Update the password directly via our backend admin route
      await api.updatePassword(userId, newPassword);
      
      Alert.alert('Success', 'Password updated successfully! You can now log in.');
      
      // Reset the entire navigation stack so they can't go back, dropping them at Login
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      
    } catch (error: any) {
      Alert.alert('Error updating password', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Intentionally missing the Back Button to lock the user in this flow */}
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reset Password</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Please create a new secure password. It must be at least 8 characters long and include a mix of letters and numbers.
          </Text>

          <CustomInput label="New Password" placeholder="Enter new password" value={newPassword} onChangeText={setNewPassword} isPassword />
          <CustomInput label="Confirm New Password" placeholder="Repeat new password" value={confirmPassword} onChangeText={setConfirmPassword} isPassword />
          
          <View style={{ marginTop: 24 }}>
            <PrimaryButton title="Confirm New Password" onPress={handleChangePassword} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  content: { padding: 24 },
  helperText: { fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 24, lineHeight: 20 },
});