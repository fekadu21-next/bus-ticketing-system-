import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { KeyboardScreen } from '@/components/keyboard-screen';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { apiService } from '@/services/api';
import { Theme } from '@/constants/theme';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await apiService.resetPassword(
      token,
      formData.newPassword,
      formData.confirmPassword
    );
    setIsSubmitting(false);

    if (result.success) {
      router.replace('/login');
    } else {
      setError(result.error || 'Failed to reset password');
    }
  };

  if (!token) {
    return (
      <KeyboardScreen style={styles.root}>
        <View style={styles.successContainer}>
          <View style={styles.warningBadge}>
            <Text style={styles.errorIcon}>⚠️</Text>
          </View>
          <Text style={styles.successTitle}>Invalid Reset Link</Text>
          <Text style={styles.successMessage}>
            This password reset link is invalid or has expired. Please request a new link to proceed.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/forgot-password')}>
            <Text style={styles.primaryButtonText}>Request New Link</Text>
          </TouchableOpacity>
        </View>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen style={styles.root}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logo}>🔐</Text>
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password to regain access</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Min 8 characters"
              placeholderTextColor={Theme.colors.textSubtle}
              value={formData.newPassword}
              onChangeText={(value) => handleChange('newPassword', value)}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              editable={!isSubmitting}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Repeat password"
              placeholderTextColor={Theme.colors.textSubtle}
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              secureTextEntry={!showConfirm}
              textContentType="newPassword"
              editable={!isSubmitting}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>
              <Text style={styles.eyeText}>{showConfirm ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <AlertBanner type="error" message={error} />
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Text>
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
  passwordInput: {
    paddingRight: 56,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '700',
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
  warningBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Theme.colors.warningLight,
    borderWidth: 1.5,
    borderColor: Theme.colors.warningBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIcon: {
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
