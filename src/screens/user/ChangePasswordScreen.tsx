import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function ChangePasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match!');
      return;
    }
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      
      await api.updatePassword(userId, newPassword);
      
      Alert.alert('Success', 'Password updated safely.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error updating password', error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Change Password</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Your new password must be at least 8 characters long and include a mix of letters, numbers, and symbols.
          </Text>

          <CustomInput label="Current Password" placeholder="Enter current password" value={oldPassword} onChangeText={setOldPassword} isPassword />
          <View style={styles.divider} />
          <CustomInput label="New Password" placeholder="Enter new password" value={newPassword} onChangeText={setNewPassword} isPassword />
          <CustomInput label="Confirm New Password" placeholder="Repeat new password" value={confirmPassword} onChangeText={setConfirmPassword} isPassword />
          
          <View style={{ marginTop: 24 }}>
            <PrimaryButton title="Update Password" onPress={handleChangePassword} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' },
  content: { padding: 24 },
  helperText: { fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  divider: { height: 24 }
});