import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Validators } from '../utils/validators';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const Colors = {
  background: '#EDE8DF',      // warm cream/beige
  surface: '#FFFFFF',
  primary: '#2D9B6F',         // green CTA
  primaryDark: '#247A58',
  text: '#1A1A1A',
  textMuted: '#8C8C8C',
  textLink: '#2D9B6F',
  border: '#FFFFFF',
  inputBg: '#FFFFFF',
  googleBorder: '#E0E0E0',
};

const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };
const Radius  = { input: 16, button: 16, full: 9999 };

// ─── Component ───────────────────────────────────────────────────────────────
interface Props {
  onAuthenticate: () => void;
}

export default function AuthScreen({ onAuthenticate }: Props) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused,  setPassFocused]  = useState(false);
  const [nameFocused,  setNameFocused]  = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAuth = () => {
    if (authMode === 'login') {
      if (!Validators.isValidEmail(email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
      if (!password) {
        Alert.alert('Missing Password', 'Please enter your password.');
        return;
      }
      onAuthenticate();
    } else {
      if (!Validators.isRequired(fullName) || !Validators.isValidEmail(email)) {
        Alert.alert('Error', 'Full name and a valid email are required.');
        return;
      }
      const check = Validators.isStrongPassword(password);
      if (!check.isValid) {
        Alert.alert('Weak Password', check.message);
        return;
      }
      onAuthenticate();
    }
  };

  const handleGoogle = () => {
    Alert.alert('Google Sign-In', 'Redirecting to Google…');
    setTimeout(onAuthenticate, 800);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Sun icon (theme toggle placeholder) */}
        <View style={styles.topRow}>
          <Ionicons name="sunny-outline" size={26} color="#C8A84B" />
        </View>

        {/* ── Logo ── */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/dog-logo.png')}
            style={styles.logo}
          />
          <Text style={styles.brandName}>SnoutScout</Text>
          <Text style={styles.brandTag}>Find your best companion</Text>
        </View>

        {/* ── Heading ── */}
        <Text style={styles.heading}>
          {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text style={styles.subheading}>
          {authMode === 'login' ? 'Sign In to continue' : 'Sign Up to continue'}
        </Text>

        {/* ── Form ── */}
        <View style={styles.form}>

          {/* Full Name (signup only) */}
          {authMode === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputRow, nameFocused && styles.inputRowFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="Input text here"
                  placeholderTextColor={Colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Input text here"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, passFocused && styles.inputRowFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Input text here"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          {authMode === 'login' && (
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleAuth}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Google ── */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogle}
          activeOpacity={0.85}
        >
          {/* Inline Google "G" coloured icon */}
          <View style={styles.googleIconWrap}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {authMode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
          </Text>
          <TouchableOpacity
            onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          >
            <Text style={styles.footerLink}>
              {authMode === 'login' ? 'Sign Up' : 'Log In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
  },

  // Top row (sun icon)
  topRow: {
    alignItems: 'flex-end',
    paddingTop: 16,
    marginBottom: 8,
  },

  // Logo block
  logoWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
  },
  brandName: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  brandTag: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Headings
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  // Form
  form: {
    gap: 4,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.input,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputRowFocused: {
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },

  // Forgot
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -6,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.textLink,
    fontWeight: '600',
  },

  // CTA button
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 4,
  },
  ctaText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#C8C0B0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.button,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.googleBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  googleIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleG: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textLink,
  },
});