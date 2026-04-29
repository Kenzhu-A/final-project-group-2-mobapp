import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Call the backend to trigger the Supabase email
      await api.forgotPassword(email);
      
      Alert.alert('Success', 'An OTP has been sent to your email.');
      
      // 2. Pass the email string dynamically to the OTP screen
      navigation.navigate('OtpVerification', { email });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Image source={require('../../assets/resetdog.png')} style={styles.image} resizeMode="contain" />
        
        <Text style={[styles.title, { color: colors.textPrimary }]}>Forgot Password?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Don't worry! It happens. Please enter the email address associated with your account.
        </Text>
        
        <CustomInput 
          label="Email Address" 
          placeholder="Enter your email" 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address" 
          autoCapitalize="none" 
        />
        
        <View style={{ marginTop: 20 }}>
          <PrimaryButton title="Send OTP" onPress={handleSendOTP} loading={loading} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: 16 },
  backBtn: { padding: 8, alignSelf: 'flex-start' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 100 },
  image: { width: 150, height: 150, alignSelf: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginBottom: 30, lineHeight: 24 },
});