import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { KeyboardScreen } from '@/components/keyboard-screen';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { useAuth } from '@/context/AuthContext';
import { Theme } from '@/constants/theme';

const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
};

const getStrengthColor = (score: number) => {
  const colors = ['#94a3b8', '#dc2626', '#f97316', '#f59e0b', '#059669'];
  return colors[score] || '#94a3b8';
};

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');

  const { score, label } = getPasswordStrength(formData.password);
  const displayError = formError || error;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) clearError();
    if (formError) setFormError('');
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
    setIsSubmitting(false);

    if (result.success) {
      if (result.data?.accessToken) {
        router.replace('/passenger/home');
      } else {
        setSuccessMessage(
          result.message || 'Account created! You can now sign in with your email and password.'
        );
      }
    } else {
      setFormError(result.error || 'Registration failed. Please check your input.');
    }
  };

  if (successMessage) {
    return (
      <KeyboardScreen>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Registration Successful!</Text>
          <Text style={styles.successMessage}>{successMessage}</Text>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => router.push('/resend-verification')}>
            <Text style={styles.resendButtonText}>Resend Verification Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => router.replace('/login')}>
            <Text style={styles.backToLoginText}>Proceed to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen style={styles.root}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logo}>🚌</Text>
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register as a passenger on {Theme.brand.name}</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Abebe"
              placeholderTextColor={Theme.colors.textSubtle}
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              autoComplete="given-name"
              textContentType="givenName"
              editable={!isSubmitting}
            />
          </View>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Kebede"
              placeholderTextColor={Theme.colors.textSubtle}
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              autoComplete="family-name"
              textContentType="familyName"
              editable={!isSubmitting}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="abebe@example.com"
            placeholderTextColor={Theme.colors.textSubtle}
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+251 911 234567"
            placeholderTextColor={Theme.colors.textSubtle}
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Min 8 characters"
              placeholderTextColor={Theme.colors.textSubtle}
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              editable={!isSubmitting}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {formData.password ? (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      score >= i &&
                        (score === 1
                          ? styles.strengthBar1
                          : score === 2
                            ? styles.strengthBar2
                            : score === 3
                              ? styles.strengthBar3
                              : styles.strengthBar4),
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: getStrengthColor(score) }]}>{label}</Text>
            </View>
          ) : null}
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

        {displayError ? (
          <AlertBanner type="error" message={displayError} />
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating account...' : 'Register Account'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/login')}>
            Sign in here
          </Text>
        </Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
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
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.textMain,
    marginBottom: 4,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
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
    paddingVertical: 11,
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
  strengthContainer: {
    marginTop: 6,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: Theme.colors.border,
    borderRadius: 2,
  },
  strengthBar1: {
    backgroundColor: '#dc2626',
  },
  strengthBar2: {
    backgroundColor: '#ea580c',
  },
  strengthBar3: {
    backgroundColor: '#d97706',
  },
  strengthBar4: {
    backgroundColor: '#059669',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    marginTop: 6,
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
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
  },
  link: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Theme.colors.bgMain,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
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
  resendButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  resendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  backToLoginButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backToLoginText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
