import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
  ScrollView, TouchableWithoutFeedback, Keyboard, TouchableOpacity, Image, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';
import { Validators } from '../utils/validators';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  // STRICT: Disable Android Hardware Back Button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; 
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleLogin = () => {
    let valid = true;
    let newErrors = { email: '', password: '' };

    if (!Validators.isValidEmail(email)) { newErrors.email = 'Please enter a valid email'; valid = false; }
    if (!Validators.isRequired(password)) { newErrors.password = 'Password is required'; valid = false; }

    setErrors(newErrors);

    if (valid) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        navigation.navigate('Home'); 
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            {/* Branding Section */}
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/dog-logo.png')} style={styles.logoImage} />
              <Image source={require('../../assets/snoutscout.png')} style={styles.textLogoImage} resizeMode="contain" />
              <Text style={styles.taglineText}>Find your best companion.</Text>
            </View>

            {/* Header Section */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              <CustomInput 
                label="Email Address" placeholder="Enter your email" 
                value={email} onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
                error={errors.email} keyboardType="email-address" autoCapitalize="none"
              />
              <CustomInput 
                label="Password" placeholder="Enter your password" 
                value={password} onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
                error={errors.password} secureTextEntry
              />

              {/* Restored Forgot Password Link */}
              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={() => navigation.navigate('ForgotPasswordScreen')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Footer / Actions Section */}
            <View style={styles.footer}>
              <PrimaryButton title="Sign In" onPress={handleLogin} loading={isLoading} disabled={!email || !password} />
              
              {/* Divider Line */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleButton}>
                <Image source={require('../../assets/googlelogo.png')} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Restored Sign Up Link */}
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
  
  // Branding Styles
  logoContainer: { alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: theme.spacing.m },
  logoImage: { width: 90, height: 90, marginBottom: theme.spacing.s },
  textLogoImage: { width: 160, height: 35 },
  taglineText: { color: theme.colors.textLight, fontSize: 12, fontFamily: theme.typography.bodyFont, marginTop: theme.spacing.xs },
  
  // Header Styles
  headerContainer: { marginBottom: theme.spacing.l },
  title: { fontSize: theme.typography.titleSize, color: theme.colors.textDark, fontFamily: theme.typography.headingFont, marginBottom: 4 },
  subtitle: { fontSize: theme.typography.subtitleSize, color: theme.colors.textLight, fontFamily: theme.typography.bodyFont },
  
  // Form Styles
  form: { marginBottom: theme.spacing.s },
  forgotPasswordContainer: { alignSelf: 'flex-end', marginTop: -theme.spacing.s, marginBottom: theme.spacing.m },
  forgotPasswordText: { color: theme.colors.primary, fontSize: 13, fontFamily: theme.typography.bodyFontBold },
  
  // Footer & Button Styles
  footer: { marginTop: 'auto' },
  
  // Divider Styles
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.l },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { marginHorizontal: theme.spacing.m, color: theme.colors.textLight, fontFamily: theme.typography.bodyFont, fontSize: 13 },
  
  // Social Auth Styles
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.button, height: 52, marginBottom: theme.spacing.l },
  googleIcon: { width: 24, height: 24, marginRight: theme.spacing.m },
  googleButtonText: { color: theme.colors.textDark, fontSize: 16, fontFamily: theme.typography.bodyFontBold },
  
  // Signup Row Styles
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xs, marginBottom: theme.spacing.s },
  footerText: { color: theme.colors.textLight, fontSize: 14, fontFamily: theme.typography.bodyFont },
  signupText: { color: theme.colors.primary, fontSize: 14, fontFamily: theme.typography.bodyFontBold },
});