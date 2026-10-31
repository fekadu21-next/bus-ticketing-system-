import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { apiService, type ActiveTripInfo } from '@/services/api';

interface ManifestPassenger {
  ticketId: string;
  ticketNumber: string;
  seatNumber: number;
  status: string;
  passengerName: string;
  phone?: string;
  verifiedAt?: string;
}

const TEAL = '#0d9488';
const TEAL_DARK = '#0f766e';
const HEADER_BG = '#11423f';
const STRIP_BG = '#0d3835';

export default function ActiveTripScreen() {
  const router = useRouter();
  const [trip, setTrip] = useState<ActiveTripInfo | null>(null);
  const [manifest, setManifest] = useState<ManifestPassenger[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTripAndManifest = useCallback(async () => {
    try {
      const res = await apiService.getActiveTrip();
      if (res.success && res.data?.trip) {
        setTrip(res.data.trip);
        if (res.data.trip.id) {
          const manifestRes = await apiService.getTripManifest(res.data.trip.id);
          if (manifestRes.success && manifestRes.data?.passengerManifest) {
            setManifest(manifestRes.data.passengerManifest);
          }
        }
      }
    } catch (err) {
      console.warn('Trip manifest fetch notice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTripAndManifest();
  }, [fetchTripAndManifest]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTripAndManifest();
  };

  const boardedCount = manifest.filter((m) => m.status === 'USED').length;
  const progress = manifest.length > 0 ? (boardedCount / manifest.length) * 100 : 0;

  const filteredManifest = manifest.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.passengerName && p.passengerName.toLowerCase().includes(q)) ||
      (p.ticketNumber && p.ticketNumber.toLowerCase().includes(q)) ||
      String(p.seatNumber).includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Manifest</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Role Strip */}
      <View style={styles.roleStrip}>
        <View style={styles.roleDot} />
        <Text style={styles.roleText}>TICKET VERIFIER · PASSENGER ROSTER</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading manifest data...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Route Card */}
          {trip ? (
            <Animated.View entering={FadeIn.duration(350)} style={styles.routeCard}>
              <View style={styles.routeRow}>
                <View style={styles.routeCity}>
                  <View style={[styles.cityDot, { backgroundColor: '#10b981' }]} />
                  <View>
                    <Text style={styles.cityRole}>FROM</Text>
                    <Text style={styles.cityName}>{trip.origin || 'Addis Ababa'}</Text>
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
                    <Text style={styles.cityName}>{trip.destination || 'Destination'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.tripMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLbl}>Departure</Text>
                  <Text style={styles.metaVal}>{trip.departureTime || '—'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLbl}>Bus Plate</Text>
                  <Text style={[styles.metaVal, { color: TEAL_DARK, fontWeight: '800' }]}>
                    {trip.busPlate || 'ETH-BUS'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLbl}>Boarding</Text>
                  <Text style={[styles.metaVal, { color: '#15803d', fontWeight: '900' }]}>
                    {boardedCount}/{manifest.length || trip.totalSeats}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(4, progress)}%` }]} />
              </View>
            </Animated.View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Active Trip</Text>
              <Text style={styles.emptySub}>Assigned trips will appear here.</Text>
            </View>
          )}

          {/* Quick Scan CTA */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.scanSection}>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => router.push('/verifier/scan')}
              activeOpacity={0.88}
            >
              <Text style={styles.scanBtnIcon}>📷</Text>
              <Text style={styles.scanBtnText}>SCAN PASSENGER TICKET</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Search bar */}
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by name, ticket code, seat..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 6 }}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Manifest List */}
          <Animated.View entering={FadeInDown.duration(400).delay(140)} style={styles.manifestSection}>
            <View style={styles.manifestHeader}>
              <Text style={styles.manifestTitle}>ROSTER ({filteredManifest.length})</Text>
              <Text style={styles.boardedRatio}>
                {boardedCount} Boarded
              </Text>
            </View>

            {filteredManifest.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>No passengers found</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? 'Try matching seat number or name.' : 'Bookings will appear on check-in.'}
                </Text>
              </View>
            ) : (
              filteredManifest.map((p) => {
                const isBoarded = p.status === 'USED';
                return (
                  <View key={p.ticketId} style={styles.passengerCard}>
                    <View style={[styles.seatBadge, isBoarded ? styles.seatBoarded : styles.seatPending]}>
                      <Text style={[styles.seatNum, isBoarded ? { color: '#ffffff' } : { color: TEAL_DARK }]}>
                        {p.seatNumber}
                      </Text>
                      <Text style={[styles.seatLbl, isBoarded ? { color: '#bbf7d0' } : { color: '#99f6e4' }]}>
                        SEAT
                      </Text>
                    </View>

                    <View style={styles.passengerInfo}>
                      <Text style={styles.passengerName}>{p.passengerName}</Text>
                      <Text style={styles.ticketNum}>{p.ticketNumber}</Text>
                      {p.phone ? <Text style={styles.passengerPhone}>{p.phone}</Text> : null}
                    </View>

                    <View style={[styles.statusChip, isBoarded ? styles.chipBoarded : styles.chipPending]}>
                      <Text style={[styles.statusChipText, isBoarded ? styles.chipTextBoarded : styles.chipTextPending]}>
                        {isBoarded ? 'BOARDED' : 'WAITING'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 13 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: HEADER_BG,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: '#ffffff', fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: { fontSize: 18, color: '#ffffff', fontWeight: '700' },

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

  scrollContent: { padding: 16, paddingBottom: 60 },

  routeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
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

  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: TEAL, borderRadius: 3 },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  emptyIcon: { fontSize: 28, marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  scanSection: { marginBottom: 14 },
  scanBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBtnIcon: { fontSize: 18 },
  scanBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 13, color: '#0f172a' },

  manifestSection: { marginBottom: 20 },
  manifestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  manifestTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  boardedRatio: { fontSize: 12, fontWeight: '700', color: '#15803d' },

  passengerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  seatBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatBoarded: { backgroundColor: TEAL_DARK },
  seatPending: { backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#99f6e4' },
  seatNum: { fontSize: 16, fontWeight: '900' },
  seatLbl: { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },

  passengerInfo: { flex: 1 },
  passengerName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  ticketNum: { fontSize: 11, color: '#64748b', marginTop: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  passengerPhone: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  chipBoarded: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  chipPending: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  statusChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  chipTextBoarded: { color: '#15803d' },
  chipTextPending: { color: '#b45309' },
});
