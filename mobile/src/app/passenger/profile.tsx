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
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import PassengerTabBar from '@/components/PassengerTabBar';

export default function PassengerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Passenger';
  const email = user?.email || 'passenger@example.com';
  const phone = user?.phone || '+251 91 100 2233';

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Incomplete Form', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await apiService.changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        Alert.alert('Success', 'Your password has been changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        Alert.alert('Error', res.error || 'Failed to change password. Please check your current password.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not reach the server to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your BusTicket account?', [
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Passenger Account</Text>
        <TouchableOpacity style={styles.logoutTopBtn} onPress={handleLogout}>
          <Text style={styles.logoutTopText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <View style={styles.accountTypeBadge}>
            <Text style={styles.accountTypeText}>PASSENGER ACCOUNT</Text>
          </View>
        </Animated.View>

        {/* Travel Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Personal Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoVal}>{fullName}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoVal}>{email}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoVal}>{phone}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Verification Status</Text>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedText}>✓ ACTIVE ACCOUNT</Text>
            </View>
          </View>
        </View>

        {/* Password Security */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.securityHeaderRow}
            onPress={() => setShowPasswordForm(!showPasswordForm)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionCardTitle}>Security & Password</Text>
              <Text style={styles.securitySub}>Update your account login password</Text>
            </View>
            <Text style={styles.expandIcon}>{showPasswordForm ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showPasswordForm && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.passwordForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
                <TextInput
                  style={styles.textInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Enter current password"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="At least 8 characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Repeat new password"
                />
              </View>

              <TouchableOpacity
                style={[styles.savePassBtn, isChangingPassword && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.savePassBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Quick Travel Hub */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>My Travel Hub</Text>
          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => router.push('/passenger/bookings')}
            activeOpacity={0.7}
          >
            <Text style={styles.supportIcon}>🎫</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>My Bookings & Tickets</Text>
              <Text style={styles.supportSub}>View active e-tickets and QR boarding passes</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#0f766e', fontWeight: '800' }}>➔</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => router.push('/passenger/trips')}
            activeOpacity={0.7}
          >
            <Text style={styles.supportIcon}>🔍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>Find & Book Bus Trips</Text>
              <Text style={styles.supportSub}>Search schedules across Ethiopian cities</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#0f766e', fontWeight: '800' }}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Support & Legal */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Help & Support</Text>
          <View style={styles.supportRow}>
            <Text style={styles.supportIcon}>📞</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>Customer Hotline</Text>
              <Text style={styles.supportSub}>+251 91 122 3344 (Addis Ababa)</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.supportRow}>
            <Text style={styles.supportIcon}>✉️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>Email Support</Text>
              <Text style={styles.supportSub}>support@busticket.et</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutButtonText}>Sign Out from BusTicket</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <PassengerTabBar />
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
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  logoutTopBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  logoutTopText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  accountTypeBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  accountTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  securityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  securitySub: {
    fontSize: 12,
    color: '#64748b',
  },
  expandIcon: {
    fontSize: 14,
    color: '#64748b',
  },
  passwordForm: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  savePassBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  savePassBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  verifiedTag: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  supportIcon: {
    fontSize: 20,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  supportSub: {
    fontSize: 12,
    color: '#64748b',
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '800',
  },
});
