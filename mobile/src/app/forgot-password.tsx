import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { KeyboardScreen } from '@/components/keyboard-screen';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { apiService } from '@/services/api';
import { Theme } from '@/constants/theme';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await apiService.forgotPassword(email.trim());
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
  };

  if (success) {
    return (
      <KeyboardScreen style={styles.root}>
        <View style={styles.successContainer}>
          <View style={styles.successBadge}>
            <Text style={styles.successIcon}>📧</Text>
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            We have sent password reset instructions to your email address. Please follow the link to set a new password.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.primaryButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen style={styles.root}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logo}>🔑</Text>
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your registered email to receive a password reset link</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor={Theme.colors.textSubtle}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!isSubmitting}
            onSubmitEditing={() => void handleSubmit()}
          />
        </View>

        {error ? (
          <AlertBanner type="error" message={error} />
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>{isSubmitting ? 'Sending...' : 'Send Reset Link'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.link}>← Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Theme.colors.bgMain,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Theme.colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    fontSize: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.textMain,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textMain,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Theme.colors.bgMain,
    borderWidth: 1.2,
    borderColor: Theme.colors.borderDark,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Theme.colors.textMain,
  },
  submitButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  link: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Theme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Theme.colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textMain,
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
