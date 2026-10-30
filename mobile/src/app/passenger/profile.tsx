import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import PassengerTabBar from '@/components/PassengerTabBar';

const ROSE = '#f43f5e';
const ROSE_DARK = '#e11d48';
const SLATE_900 = '#0f172a';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_100 = '#f1f5f9';
const SLATE_50 = '#f8fafc';
const WHITE = '#ffffff';

export default function PassengerProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();

  // Edit Profile modal & state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    (user ? 'Passenger' : 'Guest Traveler');
  const email = user?.email || '';
  const phone = user?.phone || 'Not provided';

  const handleOpenEdit = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditPhone(user?.phone || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const cleanFirst = editFirstName.trim();
    const cleanLast = editLastName.trim();

    if (!cleanFirst || !cleanLast) {
      Alert.alert('Required Fields', 'Please enter your First Name and Last Name.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await updateProfile({
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: editPhone.trim(),
      });

      if (res.success) {
        Alert.alert('Profile Updated', 'Your passenger information has been successfully updated.');
        setEditModalVisible(false);
      } else {
        Alert.alert('Update Failed', res.error || 'Could not update profile information.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

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
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your BusTicket account?', [
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
      {/* ── Top Header ────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Passenger Account</Text>
        {user ? (
          <TouchableOpacity style={styles.logoutTopBtn} onPress={handleLogout}>
            <Text style={styles.logoutTopText}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginTopBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginTopText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!user ? (
          /* Guest View */
          <Animated.View entering={FadeIn.duration(300)} style={styles.guestCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>👤</Text>
            </View>
            <Text style={styles.profileName}>Guest Account</Text>
            <Text style={styles.guestSub}>
              You are currently browsing as a guest. Sign in or create an account to view and manage your travel bookings, digital tickets, and personalized profile across web and mobile.
            </Text>
            <View style={styles.guestBtnRow}>
              <TouchableOpacity style={styles.primaryLoginBtn} onPress={() => router.push('/login')}>
                <Text style={styles.primaryLoginBtnText}>Sign In to Account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryRegisterBtn} onPress={() => router.push('/register')}>
                <Text style={styles.secondaryRegisterBtnText}>Create New Account</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          /* Authenticated Passenger View */
          <>
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

              {/* Edit Profile Action Button */}
              <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEdit} activeOpacity={0.8}>
                <Text style={styles.editProfileBtnText}>✏️ Edit Profile Information</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Personal Details Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionCardHeader}>
                <Text style={styles.sectionCardTitle}>Personal Details</Text>
                <TouchableOpacity onPress={handleOpenEdit}>
                  <Text style={styles.headerActionText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>First Name</Text>
                <Text style={styles.infoVal}>{user?.firstName || '—'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Name</Text>
                <Text style={styles.infoVal}>{user?.lastName || '—'}</Text>
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
                <Text style={styles.infoLabel}>Account Status</Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedText}>✓ VERIFIED PASSENGER</Text>
                </View>
              </View>
            </View>

            {/* Quick Links Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Travel Management</Text>

              <TouchableOpacity
                style={styles.navRowItem}
                onPress={() => router.push('/passenger/bookings')}
                activeOpacity={0.7}
              >
                <Text style={styles.navRowIcon}>🎫</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.navRowTitle}>My Travel Bookings</Text>
                  <Text style={styles.navRowSub}>View your upcoming, completed, and cancelled tickets</Text>
                </View>
                <Text style={styles.navRowArrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.navRowItem}
                onPress={() => router.push('/passenger/trips')}
                activeOpacity={0.7}
              >
                <Text style={styles.navRowIcon}>🔍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.navRowTitle}>Search Intercity Buses</Text>
                  <Text style={styles.navRowSub}>Find available routes and schedule departures across Ethiopia</Text>
                </View>
                <Text style={styles.navRowArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Security & Password Change */}
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
                <Animated.View entering={FadeIn.duration(200)} style={styles.passwordFormWrapper}>
                  <View style={styles.divider} />

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
                    <TextInput
                      style={styles.textInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      placeholder="Enter current password"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      placeholder="Enter new password (min. 8 chars)"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                    <TextInput
                      style={styles.textInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      placeholder="Repeat new password"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.savePasswordBtn, isChangingPassword && styles.savePasswordBtnDisabled]}
                    onPress={handleChangePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.savePasswordBtnText}>Update Password</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

            {/* Sign Out Card */}
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.signOutBtnText}>🚪 Sign Out from Account</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Edit Profile Modal ─────────────────────────────── */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>FIRST NAME</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="e.g. Abebe"
                  placeholderTextColor={SLATE_400}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>LAST NAME</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="e.g. Bikila"
                  placeholderTextColor={SLATE_400}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>PHONE NUMBER</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="0911 22 33 44"
                  keyboardType="phone-pad"
                  placeholderTextColor={SLATE_400}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputDisabled]}
                  value={email}
                  editable={false}
                />
                <Text style={styles.modalFieldHint}>
                  Email is linked to your account authentication and cannot be changed here.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.modalSaveBtn, isUpdatingProfile && styles.modalSaveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={isUpdatingProfile}
                activeOpacity={0.85}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator size="small" color={WHITE} />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Bottom Tab Bar */}
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
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: SLATE_900,
  },
  logoutTopBtn: {
    backgroundColor: '#fff1f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  logoutTopText: {
    color: ROSE_DARK,
    fontSize: 12,
    fontWeight: '700',
  },
  loginTopBtn: {
    backgroundColor: ROSE,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  loginTopText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
  },

  // Guest Card
  guestCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guestSub: {
    fontSize: 13,
    color: SLATE_600,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  guestBtnRow: {
    width: '100%',
    gap: 12,
  },
  primaryLoginBtn: {
    backgroundColor: ROSE,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryLoginBtnText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryRegisterBtn: {
    backgroundColor: SLATE_100,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryRegisterBtnText: {
    color: SLATE_800,
    fontWeight: '600',
    fontSize: 15,
  },

  // Profile Card
  profileCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ROSE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '900',
    color: WHITE,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: SLATE_900,
  },
  profileEmail: {
    fontSize: 12,
    color: SLATE_400,
    marginTop: 2,
  },
  accountTypeBadge: {
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  accountTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: ROSE,
    letterSpacing: 0.5,
  },
  editProfileBtn: {
    marginTop: 14,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },

  // Section Card
  sectionCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: SLATE_900,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: SLATE_400,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: SLATE_900,
  },
  verifiedTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },

  // Navigation rows
  navRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  navRowIcon: {
    fontSize: 20,
  },
  navRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: SLATE_900,
  },
  navRowSub: {
    fontSize: 11,
    color: SLATE_400,
    marginTop: 2,
  },
  navRowArrow: {
    fontSize: 16,
    color: SLATE_400,
  },

  // Security & Password
  securityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securitySub: {
    fontSize: 11,
    color: SLATE_400,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: SLATE_400,
  },
  passwordFormWrapper: {
    marginTop: 6,
  },
  formGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: SLATE_600,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: SLATE_900,
  },
  savePasswordBtn: {
    backgroundColor: ROSE,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  savePasswordBtnDisabled: {
    backgroundColor: '#fca5a5',
  },
  savePasswordBtnText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
  },

  signOutBtn: {
    backgroundColor: '#fff1f2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  signOutBtnText: {
    color: ROSE_DARK,
    fontSize: 13,
    fontWeight: '800',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: SLATE_900,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: SLATE_400,
  },
  modalInputGroup: {
    marginBottom: 12,
  },
  modalInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: SLATE_600,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: SLATE_900,
  },
  modalInputDisabled: {
    backgroundColor: '#f1f5f9',
    color: SLATE_400,
  },
  modalFieldHint: {
    fontSize: 10,
    color: SLATE_400,
    marginTop: 4,
  },
  modalSaveBtn: {
    backgroundColor: ROSE,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  modalSaveBtnDisabled: {
    backgroundColor: '#fca5a5',
  },
  modalSaveBtnText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
  },
});
