import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { KeyboardScreen } from '@/components/keyboard-screen';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) clearError();
    if (formError) setFormError('');
  };

  const handleSubmit = async () => {
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail || !formData.password) {
      setFormError('Please enter your email and password');
      return;
    }

    setIsSubmitting(true);
    const result = await login(trimmedEmail, formData.password);
    setIsSubmitting(false);

    if (result.success && result.user) {
      const roles = (result.user.roles || []).map((r: string) => String(r).toUpperCase());
      if (roles.includes('TICKET_VERIFIER') && !roles.includes('DRIVER')) {
        router.replace('/verifier/dashboard');
      } else if (roles.includes('DRIVER')) {
        router.replace('/driver' as any);
      } else {
        // Passengers land on their home booking dashboard
        router.replace('/passenger/home');
      }
    } else if (!result.success) {
      setFormError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  const displayError = formError || error;

  return (
    <KeyboardScreen style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0a1628', '#0f2744', '#0a3d2e']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
        {/* Branding */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.brandBlock}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>🚌</Text>
          </View>
          <Text style={styles.appName}>EthioRide</Text>
          <Text style={styles.tagline}>Intercity Bus Ticketing</Text>
        </Animated.View>

        {/* Glass Card */}
        <Animated.View entering={FadeInUp.duration(600).delay(150)} style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue</Text>

          {/* Email */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#6b7280"
              value={formData.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              editable={!isSubmitting}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { paddingRight: 56 }]}
              placeholder="Password"
              placeholderTextColor="#6b7280"
              value={formData.password}
              onChangeText={(v) => handleChange('password', v)}
              secureTextEntry={!showPassword}
              textContentType="password"
              editable={!isSubmitting}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((p) => !p)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeTxt}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => router.push('/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotTxt}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Error */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>⚠  {displayError}</Text>
            </View>
          ) : null}

          {/* Sign In */}
          <TouchableOpacity
            style={[styles.signInBtn, isSubmitting && styles.signInBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signInTxt}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Register */}
          <View style={styles.registerRow}>
            <Text style={styles.registerRowTxt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Guest */}
        <Animated.View entering={FadeIn.duration(600).delay(300)} style={styles.guestRow}>
          <TouchableOpacity onPress={() => router.replace('/passenger/home')} activeOpacity={0.7}>
            <Text style={styles.guestTxt}>Continue as Guest  →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  blob1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(16,118,110,0.12)',
    top: -80,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(16,118,110,0.08)',
    bottom: 60,
    left: -60,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16,118,110,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(16,118,110,0.5)',
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f0fdf4',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#6ee7b7',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 24,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 52,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#6ee7b7',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
    height: '100%',
  },
  eyeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  eyeTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6ee7b7',
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: 2,
  },
  forgotTxt: {
    fontSize: 12.5,
    color: '#6ee7b7',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorTxt: {
    fontSize: 12.5,
    color: '#fca5a5',
    fontWeight: '600',
  },
  signInBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  signInBtnDisabled: {
    opacity: 0.6,
  },
  signInTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  registerRowTxt: {
    fontSize: 13,
    color: '#94a3b8',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6ee7b7',
  },
  guestRow: {
    alignItems: 'center',
    marginTop: 24,
  },
  guestTxt: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },
});