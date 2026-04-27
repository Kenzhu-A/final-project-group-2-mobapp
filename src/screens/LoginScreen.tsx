import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
  ScrollView, TouchableWithoutFeedback, Keyboard, Image, BackHandler, Alert, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';
import { Validators } from '../utils/validators';
import { api, BASE_URL } from '../services/api'; // <-- IMPORTED BASE_URL FOR THE TEST
import AsyncStorage from '@react-native-async-storage/async-storage'

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; 
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleLogin = async () => {
    let valid = true;
    let newErrors = { email: '', password: '' };

    if (!Validators.isValidEmail(email)) { newErrors.email = 'Please enter a valid email'; valid = false; }
    if (!Validators.isRequired(password)) { newErrors.password = 'Password is required'; valid = false; }

    setErrors(newErrors);

    if (valid) {
      setIsLoading(true);
      try {
        await api.login(email, password);
        setIsLoading(false);
        navigation.navigate('Home'); 
      } catch (err: any) {
        setIsLoading(false);
        Alert.alert('Login Error', err.message);
      }
    }

    const result = await api.login(email, password);
        
        // NEW: Save the user ID to the device storage!
        await AsyncStorage.setItem('userId', result.session.user.id);
        
        setIsLoading(false);
        navigation.navigate('Home');
  };

 const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // 1. Get the URL from our backend
      const response = await api.getGoogleAuthUrl();
      
      // Note: Make sure to use response.url!
      const result = await WebBrowser.openAuthSessionAsync(response.url, 'snoutscout://auth/callback');
      
      if (result.type === 'success' && result.url) {
        
        // 2. Extract the access_token hidden inside the URL string
        const match = result.url.match(/access_token=([^&]*)/);
        const accessToken = match ? match[1] : null;

        if (!accessToken) {
          throw new Error("Authentication failed: No token received from Google.");
        }

        // 3. Send the token to our backend to verify it and get the User ID
        const userId = await api.verifyGoogleToken(accessToken);

        // 4. Save the user ID to the phone's memory so the Home screen knows who is logged in!
        await AsyncStorage.setItem('userId', userId);
        
        navigation.navigate('Home');
      }
    } catch (err: any) {
      Alert.alert("Google Login Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/dog-logo.png')} style={styles.logoImage} />
              <Image source={require('../../assets/snoutscout.png')} style={styles.textLogoImage} resizeMode="contain" />
              <Text style={styles.taglineText}>Find your best companion.</Text>
            </View>

            <View style={styles.headerContainer}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.form}>
              <CustomInput 
                label="Email Address" placeholder="Enter your email" 
                value={email} onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
                error={errors.email} keyboardType="email-address" autoCapitalize="none"
              />
              <CustomInput 
                label="Password" placeholder="Enter your password" 
                value={password} onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
                error={errors.password} isPassword={true}
              />

              <Pressable 
                style={({ pressed }) => [styles.forgotPasswordContainer, pressed && { opacity: 0.7 }]}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <PrimaryButton title="Sign In" onPress={handleLogin} loading={isLoading} disabled={!email || !password} />
              
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable 
                style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.7 }]} 
                onPress={handleGoogleLogin}
              >
                <Image source={require('../../assets/googlelogo.png')} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </Pressable>

              <View style={styles.signupRow}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Pressable 
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  onPress={() => navigation.navigate('Signup')}
                >
                  <Text style={styles.signupText}>Sign Up</Text>
                </Pressable>
              </View>

              {/* --- TEMPORARY CONNECTION TEST --- */}
              <Pressable 
                style={({ pressed }) => [styles.testButton, pressed && { opacity: 0.7 }]}
                onPress={async () => {
                  try {
                    // Pings the backend to see if it responds
                    await api.getGoogleAuthUrl();
                    Alert.alert('✅ Connection Success', `Frontend successfully reached the backend at:\n${BASE_URL}`);
                  } catch (err: any) {
                    Alert.alert('❌ Connection Failed', `Could not reach backend at:\n${BASE_URL}\n\nError: ${err.message}`);
                  }
                }}
              >
                <Text style={styles.testButtonText}>Test Backend Connection</Text>
              </Pressable>
              {/* --------------------------------- */}

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
  logoContainer: { alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: theme.spacing.m },
  logoImage: { width: 90, height: 90, marginBottom: theme.spacing.s },
  textLogoImage: { width: 160, height: 35 },
  taglineText: { color: theme.colors.textLight, fontSize: 12, fontFamily: theme.typography.bodyFont, marginTop: theme.spacing.xs },
  headerContainer: { marginBottom: theme.spacing.l },
  title: { fontSize: theme.typography.titleSize, color: theme.colors.textDark, fontFamily: theme.typography.headingFont, marginBottom: 4 },
  subtitle: { fontSize: theme.typography.subtitleSize, color: theme.colors.textLight, fontFamily: theme.typography.bodyFont },
  form: { marginBottom: theme.spacing.s },
  forgotPasswordContainer: { alignSelf: 'flex-end', marginTop: -theme.spacing.s, marginBottom: theme.spacing.m },
  forgotPasswordText: { color: theme.colors.primary, fontSize: 13, fontFamily: theme.typography.bodyFontBold },
  footer: { marginTop: 'auto' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.l },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { marginHorizontal: theme.spacing.m, color: theme.colors.textLight, fontFamily: theme.typography.bodyFont, fontSize: 13 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.button, height: 52, marginBottom: theme.spacing.l },
  googleIcon: { width: 24, height: 24, marginRight: theme.spacing.m },
  googleButtonText: { color: theme.colors.textDark, fontSize: 16, fontFamily: theme.typography.bodyFontBold },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xs, marginBottom: theme.spacing.s },
  footerText: { color: theme.colors.textLight, fontSize: 14, fontFamily: theme.typography.bodyFont },
  signupText: { color: theme.colors.primary, fontSize: 14, fontFamily: theme.typography.bodyFontBold },
  
  // Test Button Styles
  testButton: { marginTop: theme.spacing.xl, paddingVertical: 8, alignSelf: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#28A745' },
  testButtonText: { color: '#28A745', fontSize: 12, fontFamily: theme.typography.bodyFontBold },
});