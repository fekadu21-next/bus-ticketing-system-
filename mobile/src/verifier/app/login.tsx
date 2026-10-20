import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { MOCK_VERIFIER_USER } from '@/data/mockVerifierData';

export default function VerifierLoginPage() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setFormError('Please enter your verifier email and password.');
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      router.replace('/dashboard');
    }
  };

  const handleQuickDemoFill = () => {
    setEmail(MOCK_VERIFIER_USER.email);
    setPassword('Verifier@123');
    setFormError('');
    clearError();
  };

  const displayError = formError || error;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Brand Header */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🚌</Text>
            </View>
            <Text style={styles.systemTag}>EMS FIELD OPERATIONS</Text>
            <Text style={styles.appTitle}>TICKET VERIFICATION</Text>
            <Text style={styles.appSubtitle}>
              Verify passenger tickets quickly and securely at departure terminals
            </Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.card}>
            <Text style={styles.cardTitle}>Staff Sign In</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Staff Email / Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="verifier@example.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setFormError('');
                  clearError();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  setFormError('');
                  clearError();
                }}
                secureTextEntry
              />
            </View>

            {displayError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {displayError}</Text>
              </View>
            ) : null}

            {/* Quick Demo Fill */}
            <TouchableOpacity
              style={styles.quickFillBtn}
              onPress={handleQuickDemoFill}
              activeOpacity={0.8}
            >
              <Text style={styles.quickFillText}>⚡ Quick Fill Verifier Credentials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, submitting && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginBtnText}>LOGIN AS VERIFIER</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Footer Security Notice */}
          <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.footer}>
            <Text style={styles.footerNotice}>🔒 Authorized Verification Staff Only</Text>
            <Text style={styles.footerSub}>
              All scans are digitally signed and recorded to the security audit ledger.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f766e',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoIcon: {
    fontSize: 36,
  },
  systemTag: {
    color: '#99f6e4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 13,
    color: '#ccfbf1',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  quickFillBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  quickFillText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerNotice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  footerSub: {
    fontSize: 11,
    color: '#ccfbf1',
    textAlign: 'center',
  },
});
