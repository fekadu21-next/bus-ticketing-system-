import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
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
import { apiService, type DriverTrip } from '@/services/api';
import DriverTabBar from '@/components/DriverTabBar';

const TEAL = '#0d9488';
const TEAL_DARK = '#0f766e';
const HEADER_BG = '#11423f';
const STRIP_BG = '#0d3835';

const PROBLEM_TYPES = [
  { value: 'VEHICLE_PROBLEM', label: '🚗 Vehicle Issue' },
  { value: 'DELAY', label: '⏱️ Traffic Delay' },
  { value: 'ROUTE_PROBLEM', label: '🚧 Road Diversion' },
  { value: 'ACCIDENT', label: '⚠️ Collision' },
  { value: 'PASSENGER_ISSUE', label: '👥 Passenger Emergency' },
  { value: 'OTHER', label: '📝 Other' },
];

export default function DriverHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeTrip, setActiveTrip] = useState<DriverTrip | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<DriverTrip[]>([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    completed: 0,
    inProgress: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Quick Problem report modal state
  const [problemModalVisible, setProblemModalVisible] = useState(false);
  const [targetTripId, setTargetTripId] = useState<string | null>(null);
  const [problemType, setProblemType] = useState('DELAY');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemSubmitting, setProblemSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const dashRes = await apiService.getDriverDashboard();
      if (dashRes.success && dashRes.data) {
        setActiveTrip(dashRes.data.activeTrip || null);
        setUpcomingTrips(dashRes.data.upcomingTrips || []);
        if (dashRes.data.stats) {
          setStats(dashRes.data.stats);
        }
      }
    } catch (err) {
      console.warn('Driver dashboard fetch notice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of driver session?', [
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

  const handleStartTrip = (trip: DriverTrip) => {
    Alert.alert(
      'Depart Trip',
      `Depart ${trip.origin} → ${trip.destination}?\nBus: ${trip.bus?.plateNumber || 'ETH-BUS'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Departure',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await apiService.startTrip(trip.id);
              if (res.success) {
                Alert.alert('Trip Started', 'Safe journey! Trip marked In Transit.');
                await fetchDashboardData();
              } else {
                Alert.alert('Notice', res.error || 'Could not start trip.');
              }
            } catch {
              Alert.alert('Network Error', 'Check connection and try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteTrip = (trip: DriverTrip) => {
    Alert.alert(
      'Complete Trip',
      `Arrived at destination (${trip.destination})? This marks the run completed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Arrival',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await apiService.completeTrip(trip.id);
              if (res.success) {
                Alert.alert('Completed', 'Trip marked completed successfully.');
                await fetchDashboardData();
              } else {
                Alert.alert('Notice', res.error || 'Could not complete trip.');
              }
            } catch {
              Alert.alert('Network Error', 'Check connection and try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openProblemModal = (tripId?: string) => {
    const selectedId = tripId || activeTrip?.id || upcomingTrips[0]?.id || null;
    if (!selectedId) {
      Alert.alert('No Assigned Trip', 'No current trip found to attach an incident to.');
      return;
    }
    setTargetTripId(selectedId);
    setProblemType('DELAY');
    setProblemDescription('');
    setProblemModalVisible(true);
  };

  const handleSubmitProblem = async () => {
    if (!targetTripId) return;
    if (problemDescription.trim().length < 4) {
      Alert.alert('Details Required', 'Please enter a brief description.');
      return;
    }

    setProblemSubmitting(true);
    try {
      const res = await apiService.reportProblem(targetTripId, {
        type: problemType,
        description: problemDescription.trim(),
      });
      if (res.success) {
        Alert.alert('Incident Logged', 'Dispatched to fleet operations.', [
          {
            text: 'OK',
            onPress: () => {
              setProblemModalVisible(false);
              fetchDashboardData();
            },
          },
        ]);
      } else {
        Alert.alert('Notice', res.error || 'Failed to submit report.');
      }
    } catch {
      Alert.alert('Error', 'Network error submitting report.');
    } finally {
      setProblemSubmitting(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    (user?.email ? user.email.split('@')[0] : 'Driver');
  const orgName = (user as any)?.organizationName || (user as any)?.organization?.name || 'Fleet Operations';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
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
        <Text style={styles.roleText}>DRIVER · FLEET ON DUTY</Text>
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
          <View style={[styles.statCard, styles.statBlue]}>
            <Text style={styles.statNum}>{stats.totalAssigned}</Text>
            <Text style={styles.statLbl}>Assigned</Text>
          </View>
          <View style={[styles.statCard, styles.statTeal]}>
            <Text style={[styles.statNum, { color: TEAL_DARK }]}>
              {stats.inProgress || (activeTrip?.status === 'IN_PROGRESS' ? 1 : 0)}
            </Text>
            <Text style={styles.statLbl}>In Transit</Text>
          </View>
          <View style={[styles.statCard, styles.statGreen]}>
            <Text style={[styles.statNum, { color: '#15803d' }]}>{stats.completed}</Text>
            <Text style={styles.statLbl}>Completed</Text>
          </View>
        </Animated.View>

        {/* ACTIVE DISPATCH SECTION */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>CURRENT DISPATCH</Text>
            {activeTrip && (
              <TouchableOpacity
                onPress={() => router.push(`/driver/trip/${activeTrip.id}` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionLink}>Details →</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadBox}>
              <ActivityIndicator color={TEAL} />
              <Text style={styles.loadBoxText}>Fetching active dispatch...</Text>
            </View>
          ) : activeTrip ? (
            <View style={styles.tripCard}>
              {/* Route Indicator */}
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

              {/* Trip Info Grid */}
              <View style={styles.tripMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLbl}>Departure</Text>
                  <Text style={styles.metaVal}>{formatTime(activeTrip.departureTime)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLbl}>Assigned Bus</Text>
                  <Text style={[styles.metaVal, { color: TEAL_DARK }]}>
                    {activeTrip.bus?.plateNumber || 'ETH-BUS'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLbl}>Occupancy</Text>
                  <Text style={styles.metaVal}>
                    {activeTrip.bookedSeats ?? 0}/{activeTrip.totalSeats ?? 50}
                  </Text>
                </View>
              </View>

              {/* Status Badge */}
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusPill,
                    activeTrip.status === 'IN_PROGRESS' ? styles.statusTransit : styles.statusSched,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          activeTrip.status === 'IN_PROGRESS' ? '#0d9488' : '#d97706',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusTxt,
                      {
                        color:
                          activeTrip.status === 'IN_PROGRESS' ? TEAL_DARK : '#b45309',
                      },
                    ]}
                  >
                    {activeTrip.status === 'IN_PROGRESS' ? 'IN TRANSIT' : activeTrip.status}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {activeTrip.status === 'IN_PROGRESS' ? (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, styles.completeBtn]}
                    onPress={() => handleCompleteTrip(activeTrip)}
                    disabled={actionLoading}
                    activeOpacity={0.88}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>ARRIVED (COMPLETE)</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, styles.startBtn]}
                    onPress={() => handleStartTrip(activeTrip)}
                    disabled={actionLoading}
                    activeOpacity={0.88}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>START DEPARTURE</Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.outlineActionBtn}
                  onPress={() => openProblemModal(activeTrip.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineActionText}>⚠️ Report Delay</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🚌</Text>
              <Text style={styles.emptyTitle}>No Active Dispatch</Text>
              <Text style={styles.emptySub}>Assigned trips will appear here automatically.</Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={onRefresh}
                activeOpacity={0.8}
              >
                <Text style={styles.refreshBtnText}>↻ Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* UPCOMING SCHEDULED TRIP (Next Run) */}
        {upcomingTrips.length > 0 && !activeTrip && (
          <Animated.View entering={FadeInDown.duration(400).delay(140)} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>NEXT SCHEDULED RUN</Text>
              <TouchableOpacity
                onPress={() => router.push('/driver/trips' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionLink}>All Trips →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.upcomingCard}
              onPress={() => router.push(`/driver/trip/${upcomingTrips[0].id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.upcomingTop}>
                <Text style={styles.upcomingRoute}>
                  {upcomingTrips[0].origin} → {upcomingTrips[0].destination}
                </Text>
                <View style={styles.schedBadge}>
                  <Text style={styles.schedBadgeText}>Scheduled</Text>
                </View>
              </View>

              <View style={styles.upcomingMeta}>
                <Text style={styles.upcomingMetaTxt}>
                  🕐 Departure: {formatTime(upcomingTrips[0].departureTime)}
                </Text>
                <Text style={styles.upcomingMetaTxt}>
                  🚌 Bus: {upcomingTrips[0].bus?.plateNumber || 'ETH-BUS'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* QUICK FLEET TOOLS */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionHeading}>OPERATIONS</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/driver/trips' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.quickIcon}>🚌</Text>
              <Text style={styles.quickLbl}>My Trips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/driver/incidents' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.quickIcon}>🚨</Text>
              <Text style={styles.quickLbl}>Incidents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push('/driver/profile' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.quickIcon}>👤</Text>
              <Text style={styles.quickLbl}>Profile</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Incident Modal */}
      <Modal
        visible={problemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProblemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Delay / Issue</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setProblemModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalFieldLabel}>Issue Category</Text>
              <View style={styles.typeSelector}>
                {PROBLEM_TYPES.map((pt) => {
                  const isSelected = problemType === pt.value;
                  return (
                    <TouchableOpacity
                      key={pt.value}
                      style={[styles.typeOption, isSelected && styles.typeOptionSelected]}
                      onPress={() => setProblemType(pt.value)}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          isSelected && styles.typeOptionTextSelected,
                        ]}
                      >
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalFieldLabel}>Brief Description</Text>
              <TextInput
                style={styles.problemInput}
                placeholder="Location, estimated delay, or mechanical notes..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={problemDescription}
                onChangeText={setProblemDescription}
                editable={!problemSubmitting}
              />

              <TouchableOpacity
                style={[
                  styles.submitModalBtn,
                  problemSubmitting && styles.submitModalBtnDisabled,
                ]}
                onPress={handleSubmitProblem}
                disabled={problemSubmitting}
                activeOpacity={0.85}
              >
                {problemSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Submit to Dispatch</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Matching Tab Bar */}
      <DriverTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

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
  statBlue: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  statTeal: { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' },
  statGreen: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statNum: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  statLbl: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2 },

  section: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionHeading: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
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

  badgeRow: { marginBottom: 16 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusTransit: { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' },
  statusSched: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },

  actionRow: { flexDirection: 'row', gap: 10 },
  primaryActionBtn: {
    flex: 1.3,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: { backgroundColor: TEAL },
  completeBtn: { backgroundColor: '#15803d' },
  actionBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  outlineActionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  outlineActionText: { color: '#475569', fontSize: 12, fontWeight: '700' },

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
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 12 },
  refreshBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  refreshBtnText: { fontSize: 12, fontWeight: '700', color: TEAL },

  upcomingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  upcomingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  upcomingRoute: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  schedBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  schedBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400e' },
  upcomingMeta: { flexDirection: 'row', gap: 16 },
  upcomingMetaTxt: { fontSize: 12, color: '#64748b' },

  quickGrid: { flexDirection: 'row', gap: 10 },
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  modalCloseBtn: { padding: 6 },
  modalCloseText: { fontSize: 16, color: '#64748b', fontWeight: '800' },
  modalBody: { marginBottom: 10 },
  modalFieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeOptionSelected: {
    backgroundColor: '#f0fdfa',
    borderColor: TEAL,
  },
  typeOptionText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  typeOptionTextSelected: { color: TEAL_DARK, fontWeight: '800' },
  problemInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    height: 90,
    marginBottom: 16,
  },
  submitModalBtn: {
    backgroundColor: TEAL,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitModalBtnDisabled: { opacity: 0.6 },
  submitModalBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
