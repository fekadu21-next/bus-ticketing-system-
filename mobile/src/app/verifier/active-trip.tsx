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

export default function ActiveTripScreen() {
  const router = useRouter();
  const [trip, setTrip] = useState<ActiveTripInfo | null>(null);
  const [manifest, setManifest] = useState<ManifestPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTripAndManifest = useCallback(async () => {
    try {
      const res = await apiService.getActiveTrip();
      if (res.success && res.data?.trip) {
        setTrip(res.data.trip);

        // Fetch live passenger manifest for this trip
        if (res.data.trip.id) {
          const manifestRes = await apiService.getTripManifest(res.data.trip.id);
          if (manifestRes.success && manifestRes.data?.passengerManifest) {
            setManifest(manifestRes.data.passengerManifest);
          }
        }
      }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Loading assigned trip & manifest...</Text>
      </SafeAreaView>
    );
  }

  const boardedCount = manifest.filter((m) => m.status === 'USED').length;
  const pendingCount = manifest.length - boardedCount;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ACTIVE TRIP & MANIFEST</Text>
        <TouchableOpacity style={styles.headerRightAction} onPress={onRefresh}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />
        }
      >
        {/* Route Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.bannerCard}>
          <Text style={styles.bannerLabel}>ASSIGNED ROUTE</Text>
          <Text style={styles.cityText}>{trip?.origin || 'ADDIS ABABA'}</Text>
          <Text style={styles.bannerArrow}>↓</Text>
          <Text style={styles.cityText}>{trip?.destination || 'HAWASSA'}</Text>
        </Animated.View>

        {/* Trip Metadata Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Scheduled Departure</Text>
            <Text style={styles.infoValueHighlight}>{trip?.departureTime || '06:00 AM'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Bus Plate</Text>
            <View style={styles.plateTag}>
              <Text style={styles.plateText}>{trip?.busPlate || 'ETH-BUS'}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bus Model & Capacity</Text>
            <Text style={styles.infoValue}>
              {trip?.busModel || 'Coach'} • {trip?.totalSeats || 50} Seats
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Boarded / Total Booked</Text>
            <Text style={styles.verifiedText}>
              {manifest.length > 0 ? `${boardedCount} / ${manifest.length}` : `${trip?.verifiedCount || 0} Verified`}
            </Text>
          </View>
        </Animated.View>

        {/* Scan Button Action */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.actionSection}>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push('/verifier/scan')}
            activeOpacity={0.88}
          >
            <Text style={styles.scanBtnIcon}>📷</Text>
            <Text style={styles.scanBtnText}>SCAN PASSENGER TICKET</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Passenger Boarding Manifest */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.manifestSection}>
          <View style={styles.manifestHeaderRow}>
            <Text style={styles.manifestTitle}>PASSENGER MANIFEST</Text>
            <Text style={styles.manifestCount}>{manifest.length} Passenger(s)</Text>
          </View>

          {manifest.length === 0 ? (
            <View style={styles.emptyManifest}>
              <Text style={styles.emptyManifestIcon}>📋</Text>
              <Text style={styles.emptyManifestTitle}>No Booked Passengers Yet</Text>
              <Text style={styles.emptyManifestSub}>
                Tickets booked via Web or Counter will appear here in real-time.
              </Text>
            </View>
          ) : (
            manifest.map((p) => {
              const isBoarded = p.status === 'USED';
              return (
                <View key={p.ticketId} style={styles.manifestCard}>
                  <View style={styles.seatBadge}>
                    <Text style={styles.seatNumber}>#{p.seatNumber}</Text>
                    <Text style={styles.seatLabel}>SEAT</Text>
                  </View>

                  <View style={styles.passengerDetails}>
                    <Text style={styles.passengerName}>{p.passengerName}</Text>
                    <Text style={styles.ticketNumText}>Ticket: {p.ticketNumber}</Text>
                    {p.phone ? <Text style={styles.phoneText}>📞 {p.phone}</Text> : null}
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isBoarded ? styles.statusPillBoarded : styles.statusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isBoarded ? styles.statusTextBoarded : styles.statusTextPending,
                      ]}
                    >
                      {isBoarded ? '✓ BOARDED' : 'WAITING'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
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
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    fontSize: 22,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  headerRightAction: {
    padding: 6,
  },
  refreshIcon: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  bannerCard: {
    backgroundColor: '#0f766e',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#99f6e4',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  cityText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  bannerArrow: {
    fontSize: 18,
    color: '#5eead4',
    marginVertical: 2,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
  },
  infoValueHighlight: {
    fontSize: 15,
    color: '#0f766e',
    fontWeight: '800',
  },
  plateTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  plateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  verifiedText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  actionSection: {
    marginBottom: 20,
  },
  scanBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  scanBtnIcon: {
    fontSize: 20,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  manifestSection: {
    marginTop: 6,
  },
  manifestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manifestTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.6,
  },
  manifestCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
  emptyManifest: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyManifestIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyManifestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptyManifestSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  manifestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  seatBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  seatNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f766e',
  },
  seatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0d9488',
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  ticketNumText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  phoneText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillBoarded: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusPillPending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusTextBoarded: {
    color: '#059669',
  },
  statusTextPending: {
    color: '#d97706',
  },
});
