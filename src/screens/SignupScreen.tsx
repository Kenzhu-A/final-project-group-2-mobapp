import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
  ScrollView, TouchableWithoutFeedback, Keyboard, Pressable, BackHandler, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import { Validators } from '../utils/validators';
import { api } from '../services/api';

export default function SignupScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);

  // STRICT: Disable Android Hardware Back Button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; 
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleSignup = async () => {
    let valid = true;
    let newErrors = { fullName: '', email: '', password: '', confirmPassword: '' };

    if (!Validators.isValidName(form.fullName)) { newErrors.fullName = 'Full name must contain letters only'; valid = false; }
    if (!Validators.isValidEmail(form.email)) { newErrors.email = 'Please enter a valid email'; valid = false; }
    
    const passCheck = Validators.isStrongPassword(form.password);
    if (!passCheck.isValid) { newErrors.password = passCheck.message; valid = false; }
    if (form.password !== form.confirmPassword) { newErrors.confirmPassword = 'Passwords do not match'; valid = false; }

    setErrors(newErrors);

    if (valid) {
      setIsLoading(true);
      try {
        // CALL BACKEND REGISTRATION
        await api.register(form.email, form.password, form.fullName);
        setIsLoading(false);
        navigation.navigate('Home');
      } catch (err: any) {
        setIsLoading(false);
        Alert.alert("Registration Error", err.message);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join the SnoutScout community.</Text>
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
              {/* Added the eye icon toggle to the Password field */}
              <CustomInput 
                label="Password" placeholder="Create a password" 
                value={form.password} onChangeText={(t) => { setForm({ ...form, password: t }); setErrors({ ...errors, password: '' }); }}
                error={errors.password} isPassword={true}
              />
              {/* Added the eye icon toggle to the Confirm Password field */}
              <CustomInput 
                label="Confirm Password" placeholder="Repeat password" 
                value={form.confirmPassword} onChangeText={(t) => { setForm({ ...form, confirmPassword: t }); setErrors({ ...errors, confirmPassword: '' }); }}
                error={errors.confirmPassword} isPassword={true}
              />
            </View>

            <View style={styles.footer}>
              <PrimaryButton title="Create Account" onPress={handleSignup} loading={isLoading} />
              <View style={styles.loginRow}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text style={[styles.loginText, { color: colors.primary }]}>Log In</Text>
                </Pressable>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 32, marginTop: 24 },
  title: { fontSize: 28, marginBottom: 4, fontFamily: 'DMSerifDisplay_400Regular' },
  subtitle: { fontSize: 15, fontFamily: 'DMSans_400Regular' },
  form: { marginBottom: 16 },
  footer: { marginTop: 'auto', paddingBottom: 100 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  loginText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
});