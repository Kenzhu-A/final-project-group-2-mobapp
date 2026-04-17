import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
  ScrollView, TouchableWithoutFeedback, Keyboard, TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';
import { Validators } from '../utils/validators';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    let valid = true;
    let newErrors = { email: '', password: '' };

    if (!Validators.isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      setIsLoading(true);
      // Mock API Call
      setTimeout(() => {
        setIsLoading(false);
        // Proceed to main app (handled by your root navigator)
      }, 1500);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue to SnoutScout.</Text>
            </View>

            <View style={styles.form}>
              <CustomInput 
                label="Email Address" 
                placeholder="Enter your email" 
                value={email} 
                onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <CustomInput 
                label="Password" 
                placeholder="Enter your password" 
                value={password} 
                onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
                error={errors.password}
                secureTextEntry
              />

              <TouchableOpacity 
                style={styles.forgotPassword} 
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <PrimaryButton 
                title="Sign In" 
                onPress={handleLogin} 
                loading={isLoading} 
                disabled={!email || !password} 
              />
              
              <View style={styles.signupRow}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.signupText}>Sign Up</Text>
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
  header: { marginBottom: theme.spacing.xl, alignItems: 'center' },
  title: { fontSize: theme.typography.titleSize, fontWeight: 'bold', color: theme.colors.textDark, marginBottom: theme.spacing.s },
  subtitle: { fontSize: theme.typography.subtitleSize, color: theme.colors.textLight },
  form: { marginBottom: theme.spacing.xl },
  forgotPassword: { alignSelf: 'flex-end', marginTop: -theme.spacing.s, marginBottom: theme.spacing.m },
  forgotPasswordText: { color: theme.colors.primary, fontSize: theme.typography.labelSize, fontWeight: '600' },
  footer: { marginTop: 'auto' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.m },
  footerText: { color: theme.colors.textLight, fontSize: 14 },
  signupText: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' },
});