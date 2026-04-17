import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OtpInputBox from '../components/OtpInputBox';
import PrimaryButton from '../components/PrimaryButton';
import HeaderBackButton from '../components/HeaderBackButton';
import { theme } from '../theme';

export default function OtpVerificationScreen({ route, navigation }: any) {
  const { email } = route.params || { email: 'user@example.com' };
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(45);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = () => {
    if (otp.length !== 6) {
      setError('Invalid OTP code');
      return;
    }
    setError('');
    navigation.navigate('ResetPassword');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <View style={styles.content}>
            <HeaderBackButton onPress={() => navigation.goBack()} />
            
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to <Text style={styles.bold}>{email}</Text></Text>

            <OtpInputBox onComplete={(code) => { setOtp(code); setError(''); }} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PrimaryButton title="Verify Code" onPress={handleVerify} disabled={otp.length !== 6} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Didn't get a code? </Text>
              {timer > 0 ? (
                <Text style={styles.timerText}>Resend in 0:{timer.toString().padStart(2, '0')}</Text>
              ) : (
                <Text style={styles.resendText} onPress={() => setTimer(45)}>Resend code</Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  content: { flex: 1, padding: theme.spacing.l },
  title: { fontSize: theme.typography.titleSize, fontWeight: 'bold', color: theme.colors.textDark, marginBottom: theme.spacing.s },
  subtitle: { fontSize: theme.typography.subtitleSize, color: theme.colors.textLight },
  bold: { fontWeight: 'bold', color: theme.colors.textDark },
  errorText: { color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.m },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xl },
  footerText: { color: theme.colors.textLight, fontSize: 14 },
  timerText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
  resendText: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
});