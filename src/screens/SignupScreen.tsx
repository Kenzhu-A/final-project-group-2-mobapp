import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
  ScrollView, TouchableWithoutFeedback, Keyboard, TouchableOpacity, BackHandler 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';
import { Validators } from '../utils/validators';

export default function SignupScreen({ navigation }: any) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });

  // STRICT: Disable Android Hardware Back Button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; 
      
      // Store the subscription object returned by addEventListener
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
      // Call .remove() on the subscription during cleanup
      return () => subscription.remove();
    }, [])
  );

  const handleSignup = () => {
    let valid = true;
    let newErrors = { fullName: '', email: '', password: '', confirmPassword: '' };

    if (!Validators.isValidName(form.fullName)) { newErrors.fullName = 'Full name must contain letters only'; valid = false; }
    if (!Validators.isValidEmail(form.email)) { newErrors.email = 'Please enter a valid email'; valid = false; }
    
    const passCheck = Validators.isStrongPassword(form.password);
    if (!passCheck.isValid) { newErrors.password = passCheck.message; valid = false; }
    if (form.password !== form.confirmPassword) { newErrors.confirmPassword = 'Passwords do not match'; valid = false; }

    setErrors(newErrors);

    if (valid) {
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the SnoutScout community.</Text>
            </View>

            <View style={styles.form}>
              <CustomInput 
                label="Full Name" placeholder="John Doe" 
                value={form.fullName} onChangeText={(t) => { setForm({ ...form, fullName: t }); setErrors({ ...errors, fullName: '' }); }}
                error={errors.fullName} autoCapitalize="words"
              />
              <CustomInput 
                label="Email Address" placeholder="Enter your email" 
                value={form.email} onChangeText={(t) => { setForm({ ...form, email: t }); setErrors({ ...errors, email: '' }); }}
                error={errors.email} keyboardType="email-address" autoCapitalize="none"
              />
              <CustomInput 
                label="Password" placeholder="Create a password" 
                value={form.password} onChangeText={(t) => { setForm({ ...form, password: t }); setErrors({ ...errors, password: '' }); }}
                error={errors.password} secureTextEntry
              />
              <CustomInput 
                label="Confirm Password" placeholder="Repeat password" 
                value={form.confirmPassword} onChangeText={(t) => { setForm({ ...form, confirmPassword: t }); setErrors({ ...errors, confirmPassword: '' }); }}
                error={errors.confirmPassword} secureTextEntry
              />
            </View>

            <View style={styles.footer}>
              <PrimaryButton title="Create Account" onPress={handleSignup} />
              <View style={styles.loginRow}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginText}>Log In</Text>
                </TouchableOpacity>
              </View>
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
  scroll: { flexGrow: 1, padding: theme.spacing.l, justifyContent: 'center' },
  header: { marginBottom: theme.spacing.xl, marginTop: theme.spacing.l },
  title: { fontSize: theme.typography.titleSize, color: theme.colors.textDark, marginBottom: theme.spacing.xs, fontFamily: theme.typography.headingFont },
  subtitle: { fontSize: theme.typography.subtitleSize, color: theme.colors.textLight, fontFamily: theme.typography.bodyFont },
  form: { marginBottom: theme.spacing.m },
  footer: { marginTop: 'auto', paddingBottom: theme.spacing.m },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.s },
  footerText: { color: theme.colors.textLight, fontSize: 14, fontFamily: theme.typography.bodyFont },
  loginText: { color: theme.colors.primary, fontSize: 14, fontFamily: theme.typography.bodyFontBold },
});