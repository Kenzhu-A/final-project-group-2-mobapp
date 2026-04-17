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
      
      // Store the subscription object returned by addEventListener
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
      // Call .remove() on the subscription during cleanup
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
        navigation.navigate('Home'); // Navigates to main app
      }, 1000);
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
                error={errors.password} secureTextEntry
              />
            </View>

            <View style={styles.footer}>
              <PrimaryButton title="Sign In" onPress={handleLogin} loading={isLoading} disabled={!email || !password} />
              
              <TouchableOpacity style={styles.googleButton}>
                <Image source={require('../../assets/googlelogo.png')} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

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
  logoContainer: { alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: theme.spacing.l },
  logoImage: { width: 100, height: 100, marginBottom: theme.spacing.s },
  textLogoImage: { width: 180, height: 40 },
  form: { marginBottom: theme.spacing.l },
  footer: { marginTop: 'auto' },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.button, height: 52, marginBottom: theme.spacing.m },
  googleIcon: { width: 24, height: 24, marginRight: theme.spacing.m },
  googleButtonText: { color: theme.colors.textDark, fontSize: 16, fontFamily: theme.typography.bodyFontBold },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.m },
  footerText: { color: theme.colors.textLight, fontSize: 14, fontFamily: theme.typography.bodyFont },
  signupText: { color: theme.colors.primary, fontSize: 14, fontFamily: theme.typography.bodyFontBold },
});