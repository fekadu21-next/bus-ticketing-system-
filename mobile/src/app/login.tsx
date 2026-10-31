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
import { AlertBanner } from '@/components/ui/AlertBanner';
import { useAuth } from '@/context/AuthContext';
import { Theme } from '@/constants/theme';

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

      {/* Web-matching deep slate/navy gradient */}
      <LinearGradient
        colors={['#071833', '#0b2447', '#172554']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Subtle brand glow effects */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
        {/* Branding (BusTicket) */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.brandBlock}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>🚌</Text>
          </View>
          <Text style={styles.appName}>{Theme.brand.name}</Text>
          <Text style={styles.tagline}>{Theme.brand.tagline}</Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View entering={FadeInUp.duration(600).delay(150)} style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to access your tickets & trips</Text>

          {/* Email Input */}
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              value={formData.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              editable={!isSubmitting}
            />
          </View>

          {/* Password Input */}
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { paddingRight: 48 }]}
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
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

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => router.push('/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotTxt}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Error Banner */}
          {displayError ? (
            <AlertBanner type="error" message={displayError} />
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInBtn, isSubmitting && styles.signInBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.signInTxt}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerRowTxt}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Guest Option */}
        <Animated.View entering={FadeIn.duration(600).delay(300)} style={styles.guestRow}>
          <TouchableOpacity onPress={() => router.replace('/passenger/home')} activeOpacity={0.7}>
            <Text style={styles.guestTxt}>Continue as Guest →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#071833',
  },
  blob1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    top: -80,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
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
    marginBottom: 28,
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(191, 219, 254, 0.35)',
  },
  logoIcon: {
    fontSize: 34,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#93c5fd',
    marginTop: 2,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: Theme.radius.xl,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textMain,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textMain,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.bgMain,
    borderRadius: Theme.radius.md,
    borderWidth: 1.2,
    borderColor: Theme.colors.borderDark,
    paddingHorizontal: 12,
    marginBottom: 14,
    height: 48,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 8,
    color: Theme.colors.textMuted,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textMain,
    height: '100%',
  },
  eyeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  eyeTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotTxt: {
    fontSize: 12.5,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  signInBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  signInBtnDisabled: {
    opacity: 0.65,
  },
  signInTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    alignItems: 'center',
  },
  registerRowTxt: {
    fontSize: 13,
    color: Theme.colors.textMuted,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  guestRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  guestTxt: {
    fontSize: 13,
    color: '#93c5fd',
    fontWeight: '600',
  },
});
