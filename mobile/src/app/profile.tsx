import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { apiService } from '@/services/api';
import DriverTabBar from '@/components/DriverTabBar';

export default function DriverProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    (user?.email ? user.email.split('@')[0] : 'Driver');

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from the Driver App?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Validation', 'Password must be at least 8 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await apiService.changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        Alert.alert('Success', 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      } else {
        Alert.alert('Error', res.error || 'Failed to update password.');
      }
    } catch {
      Alert.alert('Error', 'Network error while updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DRIVER PROFILE</Text>
        <Text style={styles.headerSub}>Account & Security Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.driverName}>{displayName}</Text>
          <Text style={styles.driverEmail}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.driverBadge}>
              <Text style={styles.driverBadgeText}>
                {user?.roles?.[0]?.replace(/_/g, ' ') || 'DRIVER'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Account Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{displayName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email Verification</Text>
              <Text style={user?.isEmailVerified ? styles.verifiedText : styles.unverifiedText}>
                {user?.isEmailVerified ? 'Verified ✅' : 'Pending Verification ⚠️'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Change Password Toggle */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <TouchableOpacity
            style={styles.toggleSecurityBtn}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
            activeOpacity={0.8}
          >
            <Text style={styles.toggleSecurityText}>
              🔒 {showPasswordSection ? 'Hide Password Settings' : 'Change Account Password'}
            </Text>
            <Text style={styles.toggleArrow}>{showPasswordSection ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.passwordCard}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Min. 8 characters"
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Repeat new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity
                style={styles.savePasswordBtn}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.savePasswordText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Text style={styles.logoutText}>🚪 Sign Out of Driver App</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Persistent Bottom Tab Bar */}
      <DriverTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  avatarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  driverName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  driverBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  driverBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },
  unverifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d97706',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  toggleSecurityBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleSecurityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f766e',
  },
  toggleArrow: {
    fontSize: 12,
    color: '#0f766e',
  },
  passwordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  savePasswordBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  savePasswordText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '700',
  },
});
