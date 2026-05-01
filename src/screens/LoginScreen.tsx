import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableWithoutFeedback, Keyboard, Image, BackHandler, Alert, Pressable, Modal, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import { Validators } from '../utils/validators';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../utils/notifications'; // [PUSH-NOTIF]

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  // [LOGIN-MODAL] pet-themed success modal shown briefly after login
  const [successModal, setSuccessModal] = useState<{ visible: boolean; role: string; dest: string }>({ visible: false, role: 'user', dest: 'Home' });
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (successModal.visible) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
      const timer = setTimeout(() => {
        setSuccessModal((s) => ({ ...s, visible: false }));
        navigation.navigate(successModal.dest);
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0.7);
    }
  }, [successModal.visible]);

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
        const result = await api.login(email, password);
        await AsyncStorage.setItem('userId', result.session.user.id);
        await AsyncStorage.setItem('userEmail', email); // [DELETE-CONFIRM]

        // Grab the role from the API result (defaults to 'user')
        const role = result.user?.role || 'user';
        await AsyncStorage.setItem('userRole', role);

        // [PUSH-NOTIF] best-effort: register push token without blocking login
        (async () => {
          try {
            const token = await registerForPushNotificationsAsync();
            if (token) await api.registerPushToken(result.session.user.id, token);
          } catch (e) { console.warn('[PUSH-NOTIF] login token register skipped:', (e as any)?.message); }
        })();

        // [LOGIN-MODAL] show success modal, then navigate
        const dest = role === 'admin' ? 'AdminHomeScreen' : 'Home';
        setSuccessModal({ visible: true, role, dest });
      } catch (err: any) {
        Alert.alert('Login Error', err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <View style={styles.logoContainer}>
              <Image source={require('../../assets/dog-logo.png')} style={styles.logoImage} />
              <Image source={require('../../assets/snoutscout.png')} style={styles.textLogoImage} resizeMode="contain" />
              <Text style={[styles.taglineText, { color: colors.textSecondary }]}>Find your best companion.</Text>
            </View>

            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue</Text>
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
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <PrimaryButton title="Sign In" onPress={handleLogin} loading={isLoading} disabled={!email || !password} />

              <View style={styles.signupRow}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
                <Pressable
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  onPress={() => navigation.navigate('Signup')}
                >
                  <Text style={[styles.signupText, { color: colors.primary }]}>Sign Up</Text>
                </Pressable>
              </View>

            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      {/* [LOGIN-MODAL] pet-themed success overlay */}
      <Modal visible={successModal.visible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.modalPawBadge}>
              <Text style={styles.modalPawEmoji}>🐾</Text>
            </View>
            <Text style={styles.modalTitle}>Welcome back!</Text>
            <Text style={styles.modalSub}>
              {successModal.role === 'admin' ? 'Signing in as Admin…' : 'Finding your furry friends…'}
            </Text>
            <View style={styles.modalDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  logoImage: { width: 100, height: 100, marginBottom: 8 },
  textLogoImage: { width: 160, height: 35 },
  taglineText: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 4 },
  headerContainer: { marginBottom: 24, alignItems: 'center' },
  title: { fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 15, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
  form: { marginBottom: 24, paddingHorizontal: 0 },
  forgotPasswordContainer: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 20, marginRight: 0 },
  forgotPasswordText: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  footer: { marginTop: 0, marginBottom: 'auto' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 8 },
  footerText: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  signupText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  // [LOGIN-MODAL]
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#FFF', borderRadius: 24, paddingHorizontal: 40, paddingVertical: 36, alignItems: 'center', width: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 12 },
  modalPawBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D9E7518', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalPawEmoji: { fontSize: 40 },
  modalTitle: { fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#444441', marginBottom: 6, textAlign: 'center' },
  modalSub: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: '#6C757D', textAlign: 'center', marginBottom: 20 },
  modalDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#dddddd' },
  dotActive: { backgroundColor: '#1D9E75', width: 20 },
});