import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  SafeAreaView, Platform, KeyboardAvoidingView, Image, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Validators } from '../utils/validators';

export default function AuthScreen({ onAuthenticate }: { onAuthenticate: () => void }) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI State
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // --- Handlers ---
  const handleAuth = () => {
    if (authMode === 'login') {
      if (!Validators.isValidEmail(email)) {
        Alert.alert('Error', 'Please enter a valid email address.');
        return;
      }
      if (!password) {
        Alert.alert('Error', 'Please enter your password.');
        return;
      }
      onAuthenticate();
    } else {
      if (!Validators.isRequired(fullName) || !Validators.isValidEmail(email)) {
        Alert.alert('Error', 'Name and valid email are required.');
        return;
      }
      const passCheck = Validators.isStrongPassword(password);
      if (!passCheck.isValid) {
        Alert.alert('Weak Password', passCheck.message);
        return;
      }
      onAuthenticate();
    }
  };

  const handleGoogleAuth = () => {
    Alert.alert('Google Sign-In', 'Redirecting to Google secure login...');
    setTimeout(onAuthenticate, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            {/* CHANGED: Now pulling the local dog-logo.png from your assets folder */}
            <Image 
              source={require('../../assets/dog-logo.png')} 
              style={styles.logoImage} 
            />
          </View>

          {/* Header Texts */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome to SnoutScout</Text>
            <Text style={styles.subtitle}>
              {authMode === 'login' ? 'Please Sign in to Continue' : 'Create an Account to Continue'}
            </Text>
          </View>

          {/* Form Inputs */}
          <View style={styles.formContainer}>
            
            {authMode === 'signup' && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#6C757D" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Full Name" 
                  placeholderTextColor="#ADB5BD"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="E-Mail Address" 
                placeholderTextColor="#ADB5BD"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {/* Green Checkmark for valid email */}
              {Validators.isValidEmail(email) && (
                <Ionicons name="checkmark-circle" size={20} color="#28A745" />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Password" 
                placeholderTextColor="#ADB5BD"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Ionicons 
                  name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#6C757D" 
                />
              </TouchableOpacity>
            </View>

            {authMode === 'login' && (
              <TouchableOpacity style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Primary Action Button */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
              <Text style={styles.primaryButtonText}>
                {authMode === 'login' ? 'Log in' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleAuth}>
            <Ionicons name="logo-google" size={20} color="#DB4437" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Toggle Login/Signup */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              <Text style={styles.footerLink}>
                {authMode === 'login' ? 'Sign Up' : 'Log In'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  container: { 
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60, // Keeps it perfectly circular
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },

  // Headers
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6C757D',
    fontWeight: '500',
  },

  // Form Inputs
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  
  // Forgot Password
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -4, 
  },
  forgotPasswordText: {
    color: '#28A745',
    fontSize: 14,
    fontWeight: '600',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#28A745',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9ECEF',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#ADB5BD',
    fontSize: 14,
    fontWeight: '500',
  },

  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 30,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#212529',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#6C757D',
    fontSize: 14,
  },
  footerLink: {
    color: '#28A745',
    fontSize: 14,
    fontWeight: '700',
  },
});