import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import HeaderBackButton from '../components/HeaderBackButton';
import { theme } from '../theme';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    navigation.navigate('OtpVerification', { email });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            
            <HeaderBackButton onPress={() => navigation.goBack()} />
            
            <Image source={require('../../assets/resetdog.png')} style={styles.image} resizeMode="contain" />
            
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>No worries! Enter your email and we'll send you an OTP code.</Text>

            <View style={{ marginTop: theme.spacing.l }}>
              <CustomInput 
                label="Email Address" 
                placeholder="Input text here" 
                value={email} 
                onChangeText={(t) => { setEmail(t); setError(''); }}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton title="Send OTP code" onPress={handleSendOtp} disabled={!email} />
              <PrimaryButton title="Back to sign in" type="secondary" onPress={() => navigation.goBack()} />
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: theme.spacing.l },
  image: { width: 180, height: 180, alignSelf: 'center', marginBottom: theme.spacing.l },
  title: { fontSize: theme.typography.titleSize, fontWeight: 'bold', color: theme.colors.textDark, textAlign: 'center', marginBottom: theme.spacing.s },
  subtitle: { fontSize: theme.typography.subtitleSize, color: theme.colors.textLight, textAlign: 'center', paddingHorizontal: theme.spacing.m, lineHeight: 22 },
  buttonContainer: { marginTop: 'auto', paddingTop: theme.spacing.xl },
});