import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { apiService, type ActiveTripInfo } from '@/services/api';
import VerifierTabBar from '@/components/VerifierTabBar';

const TEAL = '#0d9488';
const TEAL_DARK = '#0f766e';
const HEADER_BG = '#11423f';
const STRIP_BG = '#0d3835';

export default function VerifierDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTrip, setActiveTrip] = useState<ActiveTripInfo | null>(null);
  const [stats, setStats] = useState({ total: 0, valid: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [tripRes, statsRes] = await Promise.all([
        apiService.getActiveTrip(),
        apiService.getScanStats(),
      ]);
      if (tripRes.success && tripRes.data?.trip) {
        setActiveTrip(tripRes.data.trip);
      } else {
        setActiveTrip(null);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.warn('Verifier dashboard fetch notice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of verifier session?', [
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

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    (user.email ? user.email.split('@')[0] : 'Verifier');
  const orgName = (user as any)?.organizationName || (user as any)?.organization?.name || 'Station Operations';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header matching Driver page */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.headerGreeting}>Hello, {displayName.split(' ')[0]}</Text>
            <Text style={styles.headerSub}>{orgName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.headerIconText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Role Strip */}
      <View style={styles.roleStrip}>
        <View style={styles.roleDot} />
        <Text style={styles.roleText}>TICKET VERIFIER · ON DUTY</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats Row */}
        <Animated.View entering={FadeIn.duration(350)} style={styles.statsRow}>
          <View style={[styles.statCard, styles.statGreen]}>
            <Text style={[styles.statNum, { color: '#15803d' }]}>{stats.valid}</Text>
            <Text style={styles.statLbl}>Boarded</Text>
          </View>
          <View style={[styles.statCard, styles.statBlue]}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLbl}>Scanned</Text>
          </View>
          <View style={[styles.statCard, styles.statRed]}>
            <Text style={[styles.statNum, { color: '#b91c1c' }]}>{stats.rejected}</Text>
            <Text style={styles.statLbl}>Rejected</Text>
          </View>
        </Animated.View>

        {/* Scan Hero Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.scanSection}>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push('/verifier/scan')}
            activeOpacity={0.88}
          >
            <View style={styles.scanIconRing}>
              <Text style={styles.scanIcon}>📷</Text>
            </View>
            <Text style={styles.scanTitle}>SCAN TICKET</Text>
            <Text style={styles.scanSub}>Camera QR scanner or ticket code</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Active Trip Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>CURRENT TRIP</Text>
            <TouchableOpacity onPress={() => router.push('/verifier/active-trip')} activeOpacity={0.7}>
              <Text style={styles.sectionLink}>Manifest →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadBox}>
              <ActivityIndicator color={TEAL} />
              <Text style={styles.loadBoxText}>Loading trip status...</Text>
            </View>
          ) : activeTrip ? (
            <TouchableOpacity
              style={styles.tripCard}
              onPress={() => router.push('/verifier/active-trip')}
              activeOpacity={0.86}
            >
              <View style={styles.routeRow}>
                <View style={styles.routeCity}>
                  <View style={[styles.cityDot, { backgroundColor: '#10b981' }]} />
                  <View>
                    <Text style={styles.cityRole}>FROM</Text>
                    <Text style={styles.cityName}>{activeTrip.origin || 'Addis Ababa'}</Text>
                  </View>
                </View>
                <View style={styles.routeArrow}>
                  <View style={styles.arrowLine} />
                  <Text style={styles.arrowTxt}>›</Text>
                  <View style={styles.arrowLine} />
                </View>
                <View style={[styles.routeCity, { alignItems: 'flex-end' }]}>
                  <View style={[styles.cityDot, { backgroundColor: '#0284c7' }]} />
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.cityRole}>TO</Text>
                    <Text style={styles.cityName}>{activeTrip.destination || 'Destination'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.tripMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLbl}>Departure</Text>
                  <Text style={styles.metaVal}>{activeTrip.departureTime || '—'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLbl}>Bus</Text>
                  <Text style={[styles.metaVal, { color: TEAL_DARK, fontWeight: '800' }]}>
                    {activeTrip.busPlate || 'ETH-BUS'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLbl}>Boarded</Text>
                  <Text style={[styles.metaVal, { color: '#15803d', fontWeight: '900' }]}>
                    {activeTrip.verifiedCount}/{activeTrip.totalSeats}
                  </Text>
                </View>
              </View>

              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusTxt}>
                  {activeTrip.status?.replace(/_/g, ' ') || 'SCHEDULED'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Active Trip</Text>
              <Text style={styles.emptySub}>Scheduled boarding trips will appear here.</Text>
            </View>
          )}
        </Animated.View>

        {/* Quick Operations */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)} style={styles.section}>
          <Text style={styles.sectionLabel}>OPERATIONS</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/verifier/active-trip')}
              activeOpacity={0.85}
            >
              <Text style={styles.quickIcon}>🚌</Text>
              <Text style={styles.quickLbl}>Manifest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/verifier/history' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.quickIcon}>📋</Text>
              <Text style={styles.quickLbl}>Recent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/verifier/profile')}
              activeOpacity={0.85}
            >
              <Text style={styles.quickIcon}>👤</Text>
              <Text style={styles.quickLbl}>Profile</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      <VerifierTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: HEADER_BG,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  headerGreeting: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 12, color: '#99f6e4', marginTop: 1 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 18 },

  roleStrip: {
    backgroundColor: STRIP_BG,
    paddingHorizontal: 20,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2dd4bf' },
  roleText: { fontSize: 10, fontWeight: '800', color: '#99f6e4', letterSpacing: 1.2 },

  scrollContent: { padding: 16, paddingBottom: 90 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: 4 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1 },
  statGreen: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statBlue: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  statRed: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  statNum: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  statLbl: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2 },

  scanSection: { marginBottom: 20 },
  scanBtn: {
    backgroundColor: TEAL,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  scanIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scanIcon: { fontSize: 28 },
  scanTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
  scanSub: { color: '#99f6e4', fontSize: 12 },

  section: { marginBottom: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  sectionLink: { fontSize: 13, fontWeight: '700', color: TEAL },

  tripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  routeCity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityDot: { width: 10, height: 10, borderRadius: 5 },
  cityRole: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8 },
  cityName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  routeArrow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  arrowLine: { width: 12, height: 1.5, backgroundColor: '#cbd5e1' },
  arrowTxt: { fontSize: 16, color: TEAL, fontWeight: '900', marginHorizontal: 2 },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },

  tripMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaItem: { flex: 1 },
  metaLbl: { fontSize: 11, color: '#94a3b8', marginBottom: 3, fontWeight: '600' },
  metaVal: { fontSize: 13, fontWeight: '700', color: '#0f172a' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: TEAL },
  statusTxt: { fontSize: 11, fontWeight: '800', color: TEAL_DARK, letterSpacing: 0.3 },

  loadBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  loadBoxText: { fontSize: 13, color: '#64748b' },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: { fontSize: 28, marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIcon: { fontSize: 22, marginBottom: 4 },
  quickLbl: { fontSize: 12, fontWeight: '700', color: '#334155' },
});
