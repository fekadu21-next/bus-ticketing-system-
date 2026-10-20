import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
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

export default function VerifierDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTrip, setActiveTrip] = useState<ActiveTripInfo | null>(null);
  const [stats, setStats] = useState({ total: 37, valid: 35, rejected: 2 });
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
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Samuel';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>🚌 EMS VERIFIER</Text>
          <Text style={styles.appSubtitle}>Terminal Gate Scanner</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/verifier/profile')}>
          <Text style={styles.profileInitial}>{displayName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />
        }
      >
        {/* Verifier Greeting */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroSection}>
          <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
          <Text style={styles.roleTag}>Ticket Verification Staff</Text>
        </Animated.View>

        {/* ACTIVE TRIP CARD */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>ACTIVE TRIP</Text>
            <TouchableOpacity onPress={() => router.push('/verifier/active-trip')}>
              <Text style={styles.viewAllLink}>Trip Details →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#0f766e" />
            </View>
          ) : activeTrip ? (
            <TouchableOpacity
              style={styles.activeTripCard}
              onPress={() => router.push('/verifier/active-trip')}
              activeOpacity={0.85}
            >
              <View style={styles.routeRow}>
                <View style={styles.routeCol}>
                  <Text style={styles.cityName}>{activeTrip.origin}</Text>
                  <Text style={styles.routeArrow}>↓</Text>
                  <Text style={styles.cityName}>{activeTrip.destination}</Text>
                </View>

                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{activeTrip.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.tripMetaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Departure</Text>
                  <Text style={styles.metaValue}>{activeTrip.departureTime}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Bus Plate</Text>
                  <Text style={styles.metaValue}>{activeTrip.busPlate}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Verified</Text>
                  <Text style={styles.verifiedCountText}>
                    {activeTrip.verifiedCount} / {activeTrip.totalSeats}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {/* LARGE DOMINANT SCAN TICKET BUTTON */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.scanSection}>
          <TouchableOpacity
            style={styles.bigScanBtn}
            onPress={() => router.push('/verifier/scan')}
            activeOpacity={0.88}
          >
            <View style={styles.scanIconWrap}>
              <Text style={styles.bigScanIcon}>📷</Text>
            </View>
            <Text style={styles.bigScanText}>SCAN PASSENGER TICKET</Text>
            <Text style={styles.bigScanSub}>Point camera or enter QR token</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* TODAY'S SCANS METRICS */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>TODAY&apos;S ACTIVITY</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Scanned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, styles.greenStat]}>{stats.valid}</Text>
              <Text style={styles.statLabel}>Valid Boarded</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, styles.redStat]}>{stats.rejected}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f766e',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  heroSection: {
    marginBottom: 18,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  roleTag: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  section: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
  activeTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeCol: {
    flex: 1,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  routeArrow: {
    fontSize: 16,
    color: '#0f766e',
    fontWeight: '900',
    marginVertical: 1,
  },
  statusPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  tripMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  verifiedCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f766e',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
  },
  scanSection: {
    marginBottom: 18,
  },
  bigScanBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  scanIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  bigScanIcon: {
    fontSize: 34,
  },
  bigScanText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bigScanSub: {
    color: '#ccfbf1',
    fontSize: 13,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  greenStat: {
    color: '#16a34a',
  },
  redStat: {
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
  },
});
