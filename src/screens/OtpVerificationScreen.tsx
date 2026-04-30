import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Image, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OtpInputBox from '../components/OtpInputBox';
import PrimaryButton from '../components/PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function OtpVerificationScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  
  const email = route?.params?.email || '';
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 8) {
      Alert.alert('Error', 'Please enter the complete 8-digit OTP.');
      return;
    }
    
    // Dismiss keyboard visually on submit
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const response = await api.verifyOtp(email, otp);
      
      if (response?.userId) {
          await AsyncStorage.setItem('userId', String(response.userId));
      }
      
      Alert.alert('Success', 'OTP Verified! Create your new password.');
      
      // THIS IS THE CRITICAL LINE THAT DIRECTS TO THE CORRECT SCREEN:
      navigation.replace('ChangeForgotPasswordScreen');
      
    } catch (error: any) {
      const errorMsg = error?.message || 'The OTP you entered is incorrect or expired.';
      Alert.alert('Invalid OTP', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await api.forgotPassword(email);
      Alert.alert('Sent', 'A new OTP has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to resend OTP.');
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
        
        <Text style={[styles.title, { color: colors.textPrimary }]}>Enter OTP</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          An 8-digit code has been sent to {email}
        </Text>
        
        <View style={styles.otpContainer}>
          <OtpInputBox code={otp} setCode={setOtp} maximumLength={8} />
        </View>

        <PrimaryButton title="Verify" onPress={handleVerify} loading={loading} />
        
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive the code? </Text>
          <Pressable onPress={handleResend}>
            <Text style={[styles.resendLink, { color: colors.primary }]}>Resend</Text>
          </Pressable>
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
  image: { width: 120, height: 120, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  otpContainer: { alignItems: 'center', marginBottom: 30 },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  resendText: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  resendLink: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
});