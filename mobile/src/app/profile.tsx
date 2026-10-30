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
  StatusBar,
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
    (user?.email ? user.email.split('@')[0] : 'Commercial Driver');

  const orgName = (user as any)?.organization?.name || 'Fleet Operator';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Driver App?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/landing');
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
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Sign Out Button in the Top Right */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>DRIVER PROFILE</Text>
          <Text style={styles.headerSub}>Account & Operator Credentials</Text>
        </View>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
                DUTY: {user?.roles?.[0]?.replace(/_/g, ' ') || 'COMMERCIAL DRIVER'}
              </Text>
            </View>
            <View style={styles.orgBadge}>
              <Text style={styles.orgBadgeText}>🏢 {orgName}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Account Details */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>OPERATIONAL CREDENTIALS</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Driver Name</Text>
              <Text style={styles.infoValue}>{displayName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dispatch Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Operator</Text>
              <Text style={styles.infoValueHighlight}>{orgName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform Status</Text>
              <Text style={user?.isEmailVerified ? styles.verifiedText : styles.unverifiedText}>
                {user?.isEmailVerified ? 'Verified Active ✅' : 'Active On Duty ✅'}
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
            <View style={styles.toggleSecurityLeft}>
              <Text style={styles.toggleIcon}>🔒</Text>
              <Text style={styles.toggleSecurityText}>
                {showPasswordSection ? 'Hide Password Settings' : 'Change Account Password'}
              </Text>
            </View>
            <Text style={styles.toggleArrow}>{showPasswordSection ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.passwordCard}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor="#94a3b8"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Min. 8 characters"
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Repeat new password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity
                style={styles.savePasswordBtn}
                onPress={handleChangePassword}
                disabled={passwordLoading}
                activeOpacity={0.85}
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

        {/* Logout Section Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(260)} style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Sign Out of Driver Terminal</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleWrap: {
    flex: 1,
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
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  signOutIcon: {
    fontSize: 13,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  driverName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  driverBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  driverBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
  },
  orgBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orgBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 8,
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
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoValueHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f766e',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  unverifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  toggleSecurityBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    borderRadius: 12,
  },
  toggleSecurityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleIcon: {
    fontSize: 16,
  },
  toggleSecurityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleArrow: {
    fontSize: 12,
    color: '#64748b',
  },
  passwordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutIcon: {
    fontSize: 16,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.3,
  },
});
