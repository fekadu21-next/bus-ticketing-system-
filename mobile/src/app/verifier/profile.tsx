import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import VerifierTabBar from '@/components/VerifierTabBar';

export default function VerifierProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Samuel Tesfaye';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Do you want to log out of the Ticket Verifier terminal?', [
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>VERIFIER PROFILE</Text>
        <Text style={styles.headerSub}>Terminal Operator Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Badge Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email || 'verifier@example.com'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>ROLE: TICKET_VERIFIER</Text>
            </View>
          </View>
        </Animated.View>

        {/* Details Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.infoCard}>
          <Text style={styles.cardHeader}>TERMINAL & STATION INFO</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Operator</Text>
            <Text style={styles.infoValue}>{user?.organizationName || 'Ethio Bus Express'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Terminal Gate</Text>
            <Text style={styles.infoValue}>Gate 3 - Departure Terminal</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Staff Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || '+251 922 889 900'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Terminal Status</Text>
            <Text style={styles.activeStatusText}>ONLINE & ACTIVE 🟢</Text>
          </View>
        </Animated.View>

        {/* Permissions & Scopes */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.scopeCard}>
          <Text style={styles.scopeTitle}>VERIFIER RESPONSIBILITIES</Text>
          <Text style={styles.scopeItem}>✓ Scan passenger digital & printed QR tickets</Text>
          <Text style={styles.scopeItem}>✓ Validate boarding pass eligibility in real time</Text>
          <Text style={styles.scopeItem}>✓ Grant or reject boarding entry at departure gates</Text>
          <Text style={styles.scopeItem}>✓ Audit duplicate and unauthorized ticket attempts</Text>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.logoutWrap}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Text style={styles.logoutText}>🚪 Sign Out of Terminal</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Persistent Bottom Tab Bar */}
      <VerifierTabBar />
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
    fontWeight: '900',
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  roleBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 12,
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
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  activeStatusText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  scopeCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  scopeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#166534',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scopeItem: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '600',
    lineHeight: 16,
  },
  logoutWrap: {
    marginBottom: 20,
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
    fontWeight: '800',
  },
});
