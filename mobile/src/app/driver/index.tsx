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
import {
  apiService,
  type DriverTrip,
} from '@/services/api';
import DriverTabBar from '@/components/DriverTabBar';

const PROBLEM_TYPES = [
  { value: 'VEHICLE_PROBLEM', label: '🚗 Vehicle / Mechanical Issue' },
  { value: 'DELAY', label: '⏱️ Heavy Traffic / Terminal Delay' },
  { value: 'ROUTE_PROBLEM', label: '🚧 Road Closure / Route Diversion' },
  { value: 'ACCIDENT', label: '⚠️ Road Collision / Accident' },
  { value: 'PASSENGER_ISSUE', label: '👥 Passenger Emergency / Medical' },
  { value: 'OTHER', label: '📝 Other Operational Issue' },
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
      console.warn('Failed to load driver dashboard data', err);
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

  const handleStartTrip = (trip: DriverTrip) => {
    Alert.alert(
      'Start Trip Departure',
      `Confirm departure for trip from ${trip.origin} to ${trip.destination}?\n\nAssigned Bus: ${trip.bus?.plateNumber || 'Bus'}\nThis marks the trip as IN TRANSIT.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Departure',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await apiService.startTrip(trip.id);
              if (res.success) {
                Alert.alert('Trip Started!', 'Safe travels! Trip is now marked IN TRANSIT.');
                await fetchDashboardData();
              } else {
                Alert.alert('Error', res.error || 'Could not start trip.');
              }
            } catch {
              Alert.alert('Error', 'Network error while starting trip.');
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
      'Complete Trip Arrival',
      `Have you arrived safely at ${trip.destination}?\n\nThis will mark the trip as COMPLETED and conclude the run.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Arrival',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await apiService.completeTrip(trip.id);
              if (res.success) {
                Alert.alert('Trip Completed!', 'Run completed successfully! Great job.');
                await fetchDashboardData();
              } else {
                Alert.alert('Error', res.error || 'Could not complete trip.');
              }
            } catch {
              Alert.alert('Error', 'Network error while completing trip.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openProblemModal = (tripId?: string) => {
    const selectedId = tripId || activeTrip?.id || (upcomingTrips.length > 0 ? upcomingTrips[0].id : null);
    if (!selectedId) {
      Alert.alert(
        'No Active Trip',
        'You have no assigned trips right now to attach an incident report to. Please check your assigned trips schedule.'
      );
      return;
    }
    setTargetTripId(selectedId);
    setProblemType('DELAY');
    setProblemDescription('');
    setProblemModalVisible(true);
  };

  const handleSubmitProblem = async () => {
    if (!targetTripId) {
      Alert.alert('Required', 'Please select an assigned trip for this report.');
      return;
    }
    if (problemDescription.trim().length < 5) {
      Alert.alert('Required', 'Please describe the incident in detail (at least 5 characters).');
      return;
    }

    setProblemSubmitting(true);
    try {
      const res = await apiService.reportProblem(targetTripId, {
        type: problemType,
        description: problemDescription.trim(),
      });
      if (res.success) {
        Alert.alert(
          'Incident Transmitted',
          'Your report has been logged and immediately dispatched to Operations Dispatch.',
          [
            {
              text: 'OK',
              onPress: () => {
                setProblemModalVisible(false);
                fetchDashboardData();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', res.error || 'Failed to submit problem report.');
      }
    } catch {
      Alert.alert('Error', 'Network error while submitting report.');
    } finally {
      setProblemSubmitting(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'TBD';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    (user?.email ? user.email.split('@')[0] : 'Driver');

  const orgName = (user as any)?.organization?.name || 'Fleet Operator';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Sign Out Button in the Top Right */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.brandRow}>
            <Text style={styles.appTitle}>🚌 BusDriver Pro</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>On Duty</Text>
            </View>
          </View>
          <Text style={styles.appSubtitle}>{orgName} • Operational Portal</Text>
        </View>

        {/* Top Right Sign Out Button */}
        <TouchableOpacity
          style={styles.topSignOutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.topSignOutIcon}>🚪</Text>
          <Text style={styles.topSignOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />
        }
      >
        {/* Driver Welcome Hero Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Welcome, {displayName}</Text>
              <Text style={styles.heroSub}>
                Authorized Commercial Driver • Fleet Operations
              </Text>
            </View>
          </View>

          <View style={styles.driverBadgeRow}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>DUTY: DRIVER</Text>
            </View>
            <View style={styles.orgPill}>
              <Text style={styles.orgPillText}>🏢 {orgName}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Operational Statistics */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.statsCard}>
          <Text style={styles.sectionHeadingMini}>DUTY OVERVIEW</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalAssigned}</Text>
              <Text style={styles.statLabel}>Assigned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#0f766e' }]}>
                {stats.inProgress || (activeTrip?.status === 'IN_PROGRESS' ? 1 : 0)}
              </Text>
              <Text style={styles.statLabel}>In Transit</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#16a34a' }]}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </Animated.View>

        {/* CURRENT ACTIVE / IN PROGRESS TRIP */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>ACTIVE DISPATCH</Text>
            {activeTrip && (
              <TouchableOpacity
                onPress={() => router.push(`/driver/trip/${activeTrip.id}` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewDetailsLink}>Manifest →</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#0f766e" />
              <Text style={styles.loadingTripText}>Loading assigned operations...</Text>
            </View>
          ) : activeTrip ? (
            <View style={styles.currentTripCard}>
              {/* Route banner */}
              <View style={styles.routeBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeCityOrigin}>{activeTrip.origin}</Text>
                  <Text style={styles.routeArrow}>↓</Text>
                  <Text style={styles.routeCityDest}>{activeTrip.destination}</Text>
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
                    {activeTrip.status === 'IN_PROGRESS' ? 'IN TRANSIT' : activeTrip.status}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Trip details grid */}
              <View style={styles.tripMetaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Departure Time</Text>
                  <Text style={styles.metaValue}>{formatTime(activeTrip.departureTime)}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Assigned Bus</Text>
                  <Text style={styles.metaValueHighlight}>
                    {activeTrip.bus?.plateNumber || 'ETH-BUS'}
                  </Text>
                </View>
              </View>

              {/* Occupancy bar */}
              <View style={styles.occupancyBox}>
                <View style={styles.occupancyHeader}>
                  <Text style={styles.occupancyLabel}>Passenger Bookings</Text>
                  <Text style={styles.occupancyValue}>
                    {activeTrip.bookedSeats ?? 0} / {activeTrip.totalSeats ?? 50} Seats
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.max(
                            8,
                            ((activeTrip.bookedSeats ?? 0) / (activeTrip.totalSeats ?? 50)) * 100
                          )
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.tripActionRow}>
                {activeTrip.status === 'IN_PROGRESS' ? (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, styles.completeBtn]}
                    onPress={() => handleCompleteTrip(activeTrip)}
                    disabled={actionLoading}
                    activeOpacity={0.85}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.primaryActionText}>COMPLETE TRIP (ARRIVED)</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, styles.startBtn]}
                    onPress={() => handleStartTrip(activeTrip)}
                    disabled={actionLoading}
                    activeOpacity={0.85}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.primaryActionText}>START TRIP (DEPART)</Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.incidentActionBtn}
                  onPress={() => openProblemModal(activeTrip.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.incidentActionBtnText}>⚠️ Report Delay / Issue</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noTripCard}>
              <Text style={styles.noTripIcon}>🏖️</Text>
              <Text style={styles.noTripTitle}>No Active Trips In Transit</Text>
              <Text style={styles.noTripSub}>
                You have no scheduled departures underway right now. When operations assigns you a trip, it will immediately appear here.
              </Text>
              <TouchableOpacity
                style={styles.refreshTripsBtn}
                onPress={onRefresh}
                activeOpacity={0.8}
              >
                <Text style={styles.refreshTripsBtnText}>🔄 Check For New Assignments</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* NEXT SCHEDULED RUN (Preview) */}
        {upcomingTrips.length > 0 && !activeTrip && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>NEXT SCHEDULED DEPARTURE</Text>
              <TouchableOpacity
                onPress={() => router.push('/driver/trips' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewDetailsLink}>All Trips →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.nextTripCard}
              onPress={() => router.push(`/driver/trip/${upcomingTrips[0].id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.nextTripHeader}>
                <Text style={styles.nextTripRoute}>
                  {upcomingTrips[0].origin} → {upcomingTrips[0].destination}
                </Text>
                <View style={styles.nextTripBadge}>
                  <Text style={styles.nextTripBadgeText}>Scheduled</Text>
                </View>
              </View>

              <View style={styles.nextTripDetailsRow}>
                <View style={styles.nextTripDetail}>
                  <Text style={styles.nextTripDetailLabel}>Date</Text>
                  <Text style={styles.nextTripDetailVal}>
                    {formatDate(upcomingTrips[0].departureTime)}
                  </Text>
                </View>
                <View style={styles.nextTripDetail}>
                  <Text style={styles.nextTripDetailLabel}>Departure</Text>
                  <Text style={styles.nextTripDetailVal}>
                    {formatTime(upcomingTrips[0].departureTime)}
                  </Text>
                </View>
                <View style={styles.nextTripDetail}>
                  <Text style={styles.nextTripDetailLabel}>Bus</Text>
                  <Text style={styles.nextTripDetailVal}>
                    {upcomingTrips[0].bus?.plateNumber || 'ETH-BUS'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* OPERATIONS & FLEET TOOLS (Elevated 3-Card Grid) */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <Text style={styles.sectionHeading}>FLEET OPERATIONS CENTER</Text>

          <View style={styles.toolsGrid}>
            {/* My Trips */}
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push('/driver/trips' as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.toolIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Text style={styles.toolIcon}>🚌</Text>
              </View>
              <View style={styles.toolContent}>
                <Text style={styles.toolTitle}>My Assigned Trips</Text>
                <Text style={styles.toolSub}>Browse schedules, routes & passenger manifests</Text>
              </View>
              <Text style={styles.toolArrow}>→</Text>
            </TouchableOpacity>

            {/* Incidents & Delay Reporting */}
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push('/driver/incidents' as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.toolIconWrap, { backgroundColor: '#fef2f2' }]}>
                <Text style={styles.toolIcon}>🚨</Text>
              </View>
              <View style={styles.toolContent}>
                <Text style={styles.toolTitle}>Incident & Delay Center</Text>
                <Text style={styles.toolSub}>Report road delay, mechanical issue & dispatch logs</Text>
              </View>
              <Text style={styles.toolArrow}>→</Text>
            </TouchableOpacity>

            {/* Driver Profile */}
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push('/driver/profile' as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.toolIconWrap, { backgroundColor: '#f0fdf4' }]}>
                <Text style={styles.toolIcon}>👤</Text>
              </View>
              <View style={styles.toolContent}>
                <Text style={styles.toolTitle}>Driver Profile & Security</Text>
                <Text style={styles.toolSub}>Driver credentials, license & password security</Text>
              </View>
              <Text style={styles.toolArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Quick Problem Report Modal */}
      <Modal
        visible={problemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProblemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Report Trip Incident</Text>
                <Text style={styles.modalSub}>Logged directly to Operations Dispatch</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setProblemModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Incident Category:</Text>
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

              <Text style={styles.modalLabel}>Description & Vehicle Status:</Text>
              <TextInput
                style={styles.problemInput}
                placeholder="Detail current location, road hazard, delay duration or mechanical condition..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={problemDescription}
                onChangeText={setProblemDescription}
                editable={!problemSubmitting}
              />

              <TouchableOpacity
                style={[
                  styles.submitProblemBtn,
                  problemSubmitting && styles.submitProblemBtnDisabled,
                ]}
                onPress={handleSubmitProblem}
                disabled={problemSubmitting}
                activeOpacity={0.85}
              >
                {problemSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitProblemBtnText}>TRANSMIT REPORT TO DISPATCH</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Driver Bottom Tab Bar */}
      <DriverTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topBarLeft: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  topSignOutBtn: {
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
  topSignOutIcon: {
    fontSize: 13,
  },
  topSignOutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  driverBadgeRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  rolePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.3,
  },
  orgPill: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  orgPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  sectionHeadingMini: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
  },
  viewDetailsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  loadingTripText: {
    fontSize: 12,
    color: '#64748b',
  },
  currentTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  routeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeCityOrigin: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  routeArrow: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '800',
    marginVertical: 1,
  },
  routeCityDest: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  scheduledPill: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  scheduledPillText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800',
  },
  inProgressPill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  inProgressPillText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  statusPillText: {
    letterSpacing: 0.4,
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
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  metaValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f766e',
  },
  occupancyBox: {
    marginTop: 14,
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  occupancyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  occupancyValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0f766e',
    borderRadius: 4,
  },
  tripActionRow: {
    marginTop: 16,
    gap: 8,
  },
  primaryActionBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    backgroundColor: '#16a34a',
  },
  completeBtn: {
    backgroundColor: '#2563eb',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  incidentActionBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    alignItems: 'center',
  },
  incidentActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  noTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  noTripIcon: {
    fontSize: 36,
  },
  noTripTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  noTripSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  refreshTripsBtn: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  refreshTripsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  // Next Scheduled Trip Card
  nextTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nextTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nextTripRoute: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  nextTripBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  nextTripBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  nextTripDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextTripDetail: {
    flex: 1,
  },
  nextTripDetailLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  nextTripDetailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  // Fleet Operations Tools (3 Cards)
  toolsGrid: {
    gap: 10,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIcon: {
    fontSize: 22,
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  toolSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  toolArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  typeSelector: {
    gap: 6,
    marginBottom: 14,
  },
  typeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeOptionSelected: {
    borderColor: '#0f766e',
    backgroundColor: '#f0fdfa',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeOptionTextSelected: {
    color: '#0f766e',
    fontWeight: '800',
  },
  problemInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 88,
    marginBottom: 16,
  },
  submitProblemBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitProblemBtnDisabled: {
    opacity: 0.6,
  },
  submitProblemBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
