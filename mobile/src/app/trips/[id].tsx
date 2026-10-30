import React, { useEffect, useState, useCallback } from 'react';
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
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { apiService, type DriverTrip } from '@/services/api';
import DriverTabBar from '@/components/DriverTabBar';

const PROBLEM_TYPES = [
  { value: 'VEHICLE_PROBLEM', label: '🚗 Vehicle / Mechanical Issue' },
  { value: 'DELAY', label: '⏱️ Heavy Traffic / Terminal Delay' },
  { value: 'ROUTE_PROBLEM', label: '🚧 Road Closure / Route Diversion' },
  { value: 'ACCIDENT', label: '⚠️ Road Collision / Accident' },
  { value: 'PASSENGER_ISSUE', label: '👥 Passenger Emergency / Medical' },
  { value: 'OTHER', label: '📝 Other Operational Issue' },
];

export default function TripDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { logout } = useAuth();

  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Problem report modal state
  const [problemModalVisible, setProblemModalVisible] = useState(false);
  const [problemType, setProblemType] = useState('DELAY');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemSubmitting, setProblemSubmitting] = useState(false);

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

  const fetchTripDetails = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await apiService.getDriverTripById(id);
      if (res.success && res.data?.trip) {
        setTrip(res.data.trip);
      } else {
        setError(res.error || 'Failed to load trip details');
      }
    } catch {
      setError('Network error while loading trip details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  const handleStartTrip = () => {
    Alert.alert(
      'Start Trip Departure',
      `Confirm departure from ${trip?.origin || 'origin'} to ${trip?.destination || 'destination'}?\n\nThis marks the trip as IN TRANSIT.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Departure',
          style: 'default',
          onPress: async () => {
            if (!id) return;
            setActionLoading(true);
            try {
              const res = await apiService.startTrip(id);
              if (res.success) {
                Alert.alert('Trip Started!', 'Safe journey! Trip status is now IN TRANSIT.');
                await fetchTripDetails();
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

  const handleCompleteTrip = () => {
    Alert.alert(
      'Complete Trip Arrival',
      `Have you arrived safely at ${trip?.destination || 'destination'}?\n\nThis will mark the trip as COMPLETED.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Trip',
          style: 'default',
          onPress: async () => {
            if (!id) return;
            setActionLoading(true);
            try {
              const res = await apiService.completeTrip(id);
              if (res.success) {
                Alert.alert('Trip Completed!', 'Run completed successfully! Great job.');
                await fetchTripDetails();
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

  const handleReportProblem = async () => {
    if (!id) return;
    if (problemDescription.trim().length < 5) {
      Alert.alert('Required', 'Please describe the incident in detail (at least 5 characters).');
      return;
    }

    setProblemSubmitting(true);
    try {
      const res = await apiService.reportProblem(id, {
        type: problemType,
        description: problemDescription.trim(),
      });
      if (res.success) {
        Alert.alert('Report Sent', 'Your problem report has been submitted to Operations Dispatch.');
        setProblemModalVisible(false);
        setProblemDescription('');
        await fetchTripDetails();
      } else {
        Alert.alert('Submission Error', res.error || 'Failed to submit problem report.');
      }
    } catch {
      Alert.alert('Error', 'Network error submitting problem report.');
    } finally {
      setProblemSubmitting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'IN TRANSIT', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'PUBLISHED':
      case 'SCHEDULED':
        return { label: 'SCHEDULED', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { label: status || 'UNKNOWN', bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: 'N/A', time: 'N/A' };
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusBadge(trip.status);
  const dep = formatDateTime(trip.departureTime);
  const arr = formatDateTime(trip.arrivalTime);
  const bookedCount = trip.bookedSeats ?? 0;
  const capacity = trip.bus?.capacity ?? trip.totalSeats ?? 50;
  const occupancyPct = Math.min(100, Math.round((bookedCount / capacity) * 100));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Back Button and Sign Out Button in the Top Right */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>TRIP MANIFEST</Text>
            <Text style={styles.headerSub}>Fleet Operations & Dispatch</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Route Banner Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>ASSIGNED ROUTE</Text>
              <Text style={styles.routeOrigin}>{trip.origin}</Text>
              <Text style={styles.bannerArrow}>↓</Text>
              <Text style={styles.routeDestination}>{trip.destination}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
              ]}
            >
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {statusStyle.label}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Button Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>OPERATIONAL CONTROLS</Text>

          {trip.status === 'PUBLISHED' || trip.status === 'SCHEDULED' ? (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.startBtn]}
              onPress={handleStartTrip}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryActionText}>🚌 START TRIP (DEPART)</Text>
              )}
            </TouchableOpacity>
          ) : trip.status === 'IN_PROGRESS' ? (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.completeBtn]}
                onPress={handleCompleteTrip}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryActionText}>✅ COMPLETE TRIP (ARRIVED)</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportProblemBtn}
                onPress={() => setProblemModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.reportProblemBtnText}>⚠️ Report Route Hazard / Delay</Text>
              </TouchableOpacity>
            </View>
          ) : trip.status === 'COMPLETED' ? (
            <View style={styles.completedNotice}>
              <Text style={styles.completedNoticeIcon}>🎉</Text>
              <Text style={styles.completedNoticeTitle}>Trip Completed</Text>
              <Text style={styles.completedNoticeSub}>
                Arrival recorded: {arr.date} {arr.time}
              </Text>
            </View>
          ) : (
            <View style={styles.cancelledNotice}>
              <Text style={styles.completedNoticeTitle}>Status: {trip.status}</Text>
            </View>
          )}
        </Animated.View>

        {/* Passenger Occupancy Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
          <Text style={styles.sectionTitle}>PASSENGER CAPACITY & MANIFEST</Text>
          <View style={styles.infoCard}>
            <View style={styles.occupancyHeaderRow}>
              <Text style={styles.occupancyTitle}>Booked Passengers</Text>
              <Text style={styles.occupancyCount}>
                {bookedCount} / {capacity} Seats ({occupancyPct}%)
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.max(6, occupancyPct)}%` }]} />
            </View>
            <View style={styles.occupancySubRow}>
              <Text style={styles.occupancySubText}>Available: {Math.max(0, capacity - bookedCount)} seats</Text>
              <Text style={styles.occupancySubText}>Fare: {trip.fare} ETB/seat</Text>
            </View>
          </View>
        </Animated.View>

        {/* Departure & Arrival Schedule */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>SCHEDULE TIMETABLE</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.infoLabel}>Scheduled Departure</Text>
                <Text style={styles.infoValue}>{dep.date}</Text>
              </View>
              <Text style={styles.timeHighlight}>{dep.time}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.infoLabel}>Estimated Arrival</Text>
                <Text style={styles.infoValue}>{arr.date !== 'N/A' ? arr.date : 'En Route'}</Text>
              </View>
              <Text style={styles.timeHighlight}>{arr.time !== 'N/A' ? arr.time : '~TBD'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bus Information */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>ASSIGNED FLEET BUS</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bus Model</Text>
              <Text style={styles.infoValue}>{trip.bus?.model || 'Commercial Coach'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>License Plate</Text>
              <View style={styles.plateTag}>
                <Text style={styles.plateText}>{trip.bus?.plateNumber || 'ETH-BUS'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Bus Capacity</Text>
              <Text style={styles.infoValue}>{capacity} passenger seats</Text>
            </View>
          </View>
        </Animated.View>

        {/* Existing Problem Reports for this trip */}
        {trip.problemReports && trip.problemReports.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>LOGGED TRIP INCIDENTS</Text>
            {trip.problemReports.map((p) => (
              <View key={p.id} style={styles.tripProblemItem}>
                <View style={styles.tripProblemHeader}>
                  <Text style={styles.tripProblemType}>⚠️ {p.type.replace(/_/g, ' ')}</Text>
                  <View style={styles.tripProblemBadge}>
                    <Text style={styles.tripProblemStatus}>{p.status}</Text>
                  </View>
                </View>
                <Text style={styles.tripProblemDesc}>{p.description}</Text>
                {p.notes ? (
                  <View style={styles.dispatchNoteBox}>
                    <Text style={styles.dispatchNoteLabel}>Dispatch Response:</Text>
                    <Text style={styles.dispatchNoteText}>{p.notes}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </Animated.View>
        )}

        {/* Direct Report Button */}
        <TouchableOpacity
          style={styles.secondaryProblemBtn}
          onPress={() => setProblemModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryProblemText}>🚨 Transmit Incident / Delay to Dispatch</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Problem Reporting Modal */}
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
                <Text style={styles.modalSub}>
                  Logged to Dispatch for {trip.origin} → {trip.destination}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setProblemModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Select Issue Type:</Text>
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

              <Text style={styles.modalLabel}>Detailed Description:</Text>
              <TextInput
                style={styles.problemInput}
                placeholder="Describe current location, vehicle condition or reason for delay..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={problemDescription}
                onChangeText={setProblemDescription}
                editable={!problemSubmitting}
              />

              <TouchableOpacity
                style={[styles.submitProblemBtn, problemSubmitting && styles.submitProblemBtnDisabled]}
                onPress={handleReportProblem}
                disabled={problemSubmitting}
                activeOpacity={0.85}
              >
                {problemSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitProblemBtnText}>SUBMIT REPORT TO OPERATIONS</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Bar */}
      <DriverTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 36,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  signOutBtn: {
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
  signOutIcon: {
    fontSize: 13,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  bannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  routeOrigin: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  bannerArrow: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '800',
    marginVertical: 1,
  },
  routeDestination: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  startBtn: {
    backgroundColor: '#16a34a',
  },
  completeBtn: {
    backgroundColor: '#2563eb',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reportProblemBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  reportProblemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  completedNotice: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  completedNoticeIcon: {
    fontSize: 28,
  },
  completedNoticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16a34a',
  },
  completedNoticeSub: {
    fontSize: 12,
    color: '#475569',
  },
  cancelledNotice: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  occupancyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occupancyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  occupancyCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f766e',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0f766e',
    borderRadius: 4,
  },
  occupancySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  occupancySubText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  timeHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f766e',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  plateTag: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  plateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  tripProblemItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 8,
  },
  tripProblemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripProblemType: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  tripProblemBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tripProblemStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  tripProblemDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  dispatchNoteBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  dispatchNoteLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 2,
  },
  dispatchNoteText: {
    fontSize: 11,
    color: '#1e3a8a',
  },
  secondaryProblemBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryProblemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  // Modal
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
