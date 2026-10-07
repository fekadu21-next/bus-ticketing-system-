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
import { apiService, type DriverTrip } from '@/services/api';
import DriverTabBar from '@/components/DriverTabBar';

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await apiService.getDriverTrips();
      if (res.success && res.data?.trips) {
        setTrips(res.data.trips);
      }
    } catch {
      // Keep previous state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user, fetchTrips]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  if (authLoading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    (user.email ? user.email.split('@')[0] : 'Driver');

  const activeTrip =
    trips.find((t) => t.status === 'IN_PROGRESS') ||
    trips.find((t) => t.status === 'PUBLISHED' || t.status === 'SCHEDULED');

  const otherUpcomingTrips = trips.filter(
    (t) => t.id !== activeTrip?.id && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
  );

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>🚌 BusDriver Pro</Text>
          <Text style={styles.appSubtitle}>Driver Terminal</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profile')}>
          <Text style={styles.profileInitial}>{displayName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />
        }
      >
        {/* Driver Greeting Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroCard}>
          <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
          <Text style={styles.heroSub}>
            Here are your assigned trips. Review schedule and start departure on time.
          </Text>
          <View style={styles.driverBadgeRow}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>ROLE: DRIVER</Text>
            </View>
          </View>
        </Animated.View>

        {/* Current Trip Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionHeading}>CURRENT TRIP</Text>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#0f766e" />
              <Text style={styles.loadingTripText}>Checking assigned trips...</Text>
            </View>
          ) : activeTrip ? (
            <View style={styles.currentTripCard}>
              <View style={styles.currentTripHeader}>
                <View>
                  <Text style={styles.currentTripRoute}>
                    {activeTrip.origin} → {activeTrip.destination}
                  </Text>
                  <Text style={styles.currentTripSub}>
                    Bus: <Text style={styles.boldText}>{activeTrip.bus?.plateNumber || 'ETH-1234'}</Text>
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    activeTrip.status === 'IN_PROGRESS'
                      ? styles.inProgressPill
                      : styles.scheduledPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      activeTrip.status === 'IN_PROGRESS'
                        ? styles.inProgressPillText
                        : styles.scheduledPillText,
                    ]}
                  >
                    {activeTrip.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.tripDataRow}>
                <View>
                  <Text style={styles.metaLabel}>Departure</Text>
                  <Text style={styles.metaValue}>{formatTime(activeTrip.departureTime)}</Text>
                </View>
                <View>
                  <Text style={styles.metaLabel}>Capacity</Text>
                  <Text style={styles.metaValue}>{activeTrip.bus?.capacity || 50} seats</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewTripBtn}
                onPress={() => router.push(`/trips/${activeTrip.id}` as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.viewTripBtnText}>
                  {activeTrip.status === 'IN_PROGRESS' ? 'MANAGE IN-PROGRESS TRIP →' : 'VIEW TRIP & START →'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noTripCard}>
              <Text style={styles.noTripIcon}>🏖️</Text>
              <Text style={styles.noTripTitle}>No Active Trips Assigned</Text>
              <Text style={styles.noTripSub}>
                You have no scheduled trips right now. When an Operational Manager assigns you a trip, it will appear here.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Next Trip Section */}
        {otherUpcomingTrips.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
            <Text style={styles.sectionHeading}>NEXT TRIP</Text>
            <TouchableOpacity
              style={styles.nextTripCard}
              onPress={() => router.push(`/trips/${otherUpcomingTrips[0].id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.nextTripHeader}>
                <Text style={styles.nextTripRoute}>
                  {otherUpcomingTrips[0].origin} → {otherUpcomingTrips[0].destination}
                </Text>
                <Text style={styles.nextTripTime}>
                  {formatTime(otherUpcomingTrips[0].departureTime)}
                </Text>
              </View>
              <Text style={styles.nextTripBus}>
                Bus: {otherUpcomingTrips[0].bus?.plateNumber || 'Assigned Bus'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Quick Access to My Trips */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <TouchableOpacity
            style={styles.myTripsBanner}
            onPress={() => router.push('/trips' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.myTripsBannerContent}>
              <Text style={styles.myTripsBannerTitle}>🚌 View All Assigned Trips</Text>
              <Text style={styles.myTripsBannerSub}>
                Access complete schedule, past completed routes, and trip status history.
              </Text>
            </View>
            <Text style={styles.myTripsArrow}>→</Text>
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
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
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
    fontWeight: '800',
    color: '#0f766e',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  heroCard: {
    backgroundColor: '#0f766e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: '#ccfbf1',
    lineHeight: 18,
    marginBottom: 14,
  },
  driverBadgeRow: {
    flexDirection: 'row',
  },
  rolePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rolePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  currentTripCard: {
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
  currentTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  currentTripRoute: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  currentTripSub: {
    fontSize: 13,
    color: '#64748b',
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scheduledPill: {
    backgroundColor: '#eff6ff',
  },
  scheduledPillText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
  },
  inProgressPill: {
    backgroundColor: '#ecfdf5',
  },
  inProgressPillText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  tripDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  viewTripBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewTripBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  loadingTripText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 13,
  },
  noTripCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noTripIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  noTripTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  noTripSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  nextTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nextTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nextTripRoute: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  nextTripTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f766e',
  },
  nextTripBus: {
    fontSize: 12,
    color: '#64748b',
  },
  myTripsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 16,
  },
  myTripsBannerContent: {
    flex: 1,
  },
  myTripsBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  myTripsBannerSub: {
    fontSize: 12,
    color: '#15803d',
    lineHeight: 16,
  },
  myTripsArrow: {
    fontSize: 20,
    color: '#166534',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
