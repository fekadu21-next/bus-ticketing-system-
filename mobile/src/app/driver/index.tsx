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
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import {
  apiService,
  type DriverTrip,
  type DriverProblemReport,
} from '@/services/api';
import DriverTabBar from '@/components/DriverTabBar';

const PROBLEM_TYPES = [
  { value: 'VEHICLE_PROBLEM', label: '🚗 Vehicle / Mechanical Issue' },
  { value: 'DELAY', label: '⏱️ Heavy Traffic / Terminal Delay' },
  { value: 'ROUTE_PROBLEM', label: '🚧 Road Closure / Route Diversion' },
  { value: 'ACCIDENT', label: '⚠️ Road Collision / Accident' },
  { value: 'PASSENGER_ISSUE', label: '👥 Passenger Medical / Emergency' },
  { value: 'OTHER', label: '📝 Other Operational Issue' },
];

export default function DriverHomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTrip, setActiveTrip] = useState<DriverTrip | null>(null);
  const [todayTrips, setTodayTrips] = useState<DriverTrip[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<DriverTrip[]>([]);
  const [reportedProblems, setReportedProblems] = useState<DriverProblemReport[]>([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    completed: 0,
    inProgress: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Problem report modal state
  const [problemModalVisible, setProblemModalVisible] = useState(false);
  const [targetTripId, setTargetTripId] = useState<string | null>(null);
  const [problemType, setProblemType] = useState('VEHICLE_PROBLEM');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemSubmitting, setProblemSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashRes, problemsRes] = await Promise.all([
        apiService.getDriverDashboard(),
        apiService.getDriverProblems(),
      ]);

      if (dashRes.success && dashRes.data) {
        setActiveTrip(dashRes.data.activeTrip || null);
        setTodayTrips(dashRes.data.todayTrips || []);
        setUpcomingTrips(dashRes.data.upcomingTrips || []);
        if (dashRes.data.stats) {
          setStats(dashRes.data.stats);
        }
      }

      if (problemsRes.success && problemsRes.data?.reports) {
        setReportedProblems(problemsRes.data.reports.slice(0, 5));
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

  const handleStartTrip = (trip: DriverTrip) => {
    Alert.alert(
      'Start Trip Departure',
      `Departing from ${trip.origin} to ${trip.destination}.\nBus Plate: ${trip.bus?.plateNumber || 'ETH-BUS'}\n\nConfirm departure now?`,
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
                Alert.alert('Trip Started!', 'Trip status updated to IN PROGRESS. Safe travels!');
                await fetchDashboardData();
              } else {
                Alert.alert('Error', res.error || 'Failed to start trip.');
              }
            } catch {
              Alert.alert('Network Error', 'Could not communicate with dispatch server.');
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
      `Have you arrived safely at ${trip.destination}?\n\nThis will mark this trip as COMPLETED.`,
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
                Alert.alert('Trip Completed!', 'Excellent work. Trip is marked as COMPLETED.');
                await fetchDashboardData();
              } else {
                Alert.alert('Error', res.error || 'Failed to complete trip.');
              }
            } catch {
              Alert.alert('Network Error', 'Could not communicate with dispatch server.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openProblemModal = (tripId?: string) => {
    const idToUse = tripId || activeTrip?.id || null;
    if (!idToUse) {
      Alert.alert('No Active Trip', 'Problem reports must be associated with an assigned trip.');
      return;
    }
    setTargetTripId(idToUse);
    setProblemType('VEHICLE_PROBLEM');
    setProblemDescription('');
    setProblemModalVisible(true);
  };

  const handleSubmitProblem = async () => {
    if (!targetTripId) return;
    if (problemDescription.trim().length < 3) {
      Alert.alert('Description Required', 'Please enter at least 3 characters describing the issue.');
      return;
    }

    setProblemSubmitting(true);
    try {
      const res = await apiService.reportProblem(targetTripId, {
        type: problemType,
        description: problemDescription.trim(),
      });
      if (res.success) {
        Alert.alert('Report Logged', 'Your incident report has been submitted to Fleet Operations.');
        setProblemModalVisible(false);
        setProblemDescription('');
        await fetchDashboardData();
      } else {
        Alert.alert('Submission Error', res.error || 'Could not record incident report.');
      }
    } catch {
      Alert.alert('Network Error', 'Failed to submit problem report. Please try again.');
    } finally {
      setProblemSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Verifying Driver Credentials...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  // Redirect verifier-only accounts
  if (
    user.roles?.includes('TICKET_VERIFIER') &&
    !user.roles?.includes('DRIVER') &&
    !user.roles?.includes('ADMIN')
  ) {
    return <Redirect href="/verifier/dashboard" />;
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    (user.email ? user.email.split('@')[0] : 'Driver');
  const orgName = user.organizationName || 'Fleet Operations';

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getProblemStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'IN_REVIEW':
      case 'ACKNOWLEDGED':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      default:
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.appTitle}>🚌 BusDriver Pro</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Online</Text>
            </View>
          </View>
          <Text style={styles.appSubtitle}>{orgName} • Driver Terminal</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push('/driver/profile' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.profileInitial}>{displayName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {/* Driver Greeting Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Welcome, {displayName}</Text>
              <Text style={styles.heroSub}>
                Authorized Driver • Assigned Fleet Operations
              </Text>
            </View>
            <View style={styles.heroAvatarBadge}>
              <Text style={styles.heroAvatarText}>🪪</Text>
            </View>
          </View>

          <View style={styles.driverBadgeRow}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>DUTY: DRIVER</Text>
            </View>
            <View style={[styles.rolePill, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Text style={[styles.rolePillText, { color: '#16a34a' }]}>🏢 {orgName}</Text>
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
              <Text style={[styles.statNumber, { color: '#2563eb' }]}>
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
              <ActivityIndicator color="#2563eb" />
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
                  <Text style={styles.metaLabel}>Departure</Text>
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
              <Text style={styles.noTripTitle}>No Active Trips Assigned</Text>
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

        {/* UPCOMING TRIPS SCHEDULE */}
        {upcomingTrips.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(220)} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>UPCOMING SCHEDULE</Text>
              <TouchableOpacity
                onPress={() => router.push('/driver/trips' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewDetailsLink}>View All ({upcomingTrips.length}) →</Text>
              </TouchableOpacity>
            </View>

            {upcomingTrips.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.upcomingTripCard}
                onPress={() => router.push(`/driver/trip/${item.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.upcomingHeader}>
                  <Text style={styles.upcomingRoute}>
                    {item.origin} → {item.destination}
                  </Text>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>Scheduled</Text>
                  </View>
                </View>
                <View style={styles.upcomingMetaRow}>
                  <Text style={styles.upcomingTime}>⏱️ {formatTime(item.departureTime)}</Text>
                  <Text style={styles.upcomingBus}>
                    🚌 {item.bus?.plateNumber || 'ETH-BUS'} ({item.bookedSeats || 0} seats)
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* RECENT REPORTED INCIDENTS */}
        {reportedProblems.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(280)} style={styles.section}>
            <Text style={styles.sectionHeading}>MY REPORTED INCIDENTS</Text>
            {reportedProblems.map((p) => {
              const statusBadge = getProblemStatusColor(p.status);
              return (
                <View key={p.id} style={styles.problemCard}>
                  <View style={styles.problemHeader}>
                    <Text style={styles.problemTypeTitle}>
                      {p.type.replace(/_/g, ' ')}
                    </Text>
                    <View
                      style={[
                        styles.problemStatusPill,
                        { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
                      ]}
                    >
                      <Text style={[styles.problemStatusText, { color: statusBadge.text }]}>
                        {p.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.problemDesc}>{p.description}</Text>
                  {p.notes ? (
                    <View style={styles.problemNotesBox}>
                      <Text style={styles.problemNotesTitle}>Operations Response:</Text>
                      <Text style={styles.problemNotesText}>{p.notes}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.problemDate}>
                    Reported on: {new Date(p.created_at).toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* QUICK SHORTCUTS */}
        <Animated.View entering={FadeInDown.duration(400).delay(320)} style={styles.section}>
          <Text style={styles.sectionHeading}>FLEET TOOLS</Text>
          <View style={styles.shortcutsGrid}>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/driver/trips' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.shortcutIcon}>📋</Text>
              <Text style={styles.shortcutTitle}>Assigned Trips</Text>
              <Text style={styles.shortcutSub}>Past and upcoming routes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => openProblemModal()}
              activeOpacity={0.8}
            >
              <Text style={styles.shortcutIcon}>🚨</Text>
              <Text style={styles.shortcutTitle}>Report Issue</Text>
              <Text style={styles.shortcutSub}>Mechanical, traffic, road</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/driver/profile' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.shortcutIcon}>👤</Text>
              <Text style={styles.shortcutTitle}>Driver Profile</Text>
              <Text style={styles.shortcutSub}>Security and account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Incident / Problem Reporting Modal */}
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
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  heroAvatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatarText: {
    fontSize: 20,
  },
  driverBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rolePill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeadingMini: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  viewDetailsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  loadingTripText: {
    fontSize: 13,
    color: '#64748b',
  },
  currentTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#2563eb',
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
    color: '#2563eb',
    fontWeight: '800',
    marginVertical: 1,
  },
  routeCityDest: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563eb',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  inProgressPill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  scheduledPill: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inProgressPillText: {
    color: '#059669',
  },
  scheduledPillText: {
    color: '#2563eb',
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
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  metaValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
    marginTop: 2,
  },
  occupancyBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  occupancyLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  occupancyValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  tripActionRow: {
    marginTop: 14,
    gap: 8,
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    backgroundColor: '#2563eb',
  },
  completeBtn: {
    backgroundColor: '#2563eb',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  incidentActionBtn: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  incidentActionBtnText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
  },
  noTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  noTripIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  noTripTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  noTripSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshTripsBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  refreshTripsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  upcomingTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingRoute: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  upcomingBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upcomingTime: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  upcomingBus: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  problemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  problemTypeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  problemStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  problemStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  problemDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  problemNotesBox: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 4,
  },
  problemNotesTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  problemNotesText: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 2,
  },
  problemDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: 4,
  },
  shortcutIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  shortcutSub: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeSelector: {
    gap: 6,
    marginBottom: 16,
  },
  typeOption: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  typeOptionSelected: {
    backgroundColor: '#f0fdfa',
    borderColor: '#2563eb',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  typeOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '800',
  },
  problemInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    height: 90,
    marginBottom: 20,
  },
  submitProblemBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitProblemBtnDisabled: {
    opacity: 0.6,
  },
  submitProblemBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
