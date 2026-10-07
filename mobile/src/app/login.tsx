import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { KeyboardScreen } from '@/components/keyboard-screen';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { MOCK_DRIVER_USER } from '@/data/mockDriverData';

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
    if (!formData.email.trim() || !formData.password) {
      setFormError('Driver email and password are required');
      return;
    }

    setIsSubmitting(true);
    const result = await login(formData.email.trim(), formData.password);
    setIsSubmitting(false);

    if (result.success) {
      router.replace('/dashboard');
    }
  };

  const handleQuickDemoFill = () => {
    setFormData({
      email: MOCK_DRIVER_USER.email,
      password: 'password123',
    });
    setFormError('');
  };

  const displayError = formError || error;

  return (
    <KeyboardScreen>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Text style={styles.logo}>🚌</Text>
        </View>
        <Text style={styles.title}>Driver Sign In</Text>
        <Text style={styles.subtitle}>Log in to access your assigned trips & route terminal</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Driver Email / Username</Text>
          <TextInput
            style={styles.input}
            placeholder="driver@example.com"
            placeholderTextColor="#94a3b8"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!isSubmitting}
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.passwordHeader}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={() => void handleSubmit()}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {displayError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {displayError}</Text>
          </View>
        ) : null}

        {/* Quick Demo Fill Button */}
        <TouchableOpacity
          style={styles.demoFillBtn}
          onPress={handleQuickDemoFill}
          activeOpacity={0.8}
        >
          <Text style={styles.demoFillBtnText}>⚡ Fill Demo Driver Credentials</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Signing in...' : 'Sign In as Driver'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Welcome</Text>
      </TouchableOpacity>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ccfbf1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    fontSize: 34,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
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
  passwordInput: {
    paddingRight: 64,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 13,
    color: '#0f766e',
    fontWeight: '700',
  },
  forgotPassword: {
    fontSize: 12,
    color: '#0f766e',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  demoFillBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  demoFillBtnText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#0f766e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});
