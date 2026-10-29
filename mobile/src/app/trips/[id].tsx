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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { apiService, type DriverTrip } from '@/services/api';

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

  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Problem report modal state
  const [problemModalVisible, setProblemModalVisible] = useState(false);
  const [problemType, setProblemType] = useState('VEHICLE_PROBLEM');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemSubmitting, setProblemSubmitting] = useState(false);

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
      'Start Trip',
      `Are you ready to depart from ${trip?.origin || 'origin'} to ${trip?.destination || 'destination'}?`,
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
                Alert.alert('Trip Started!', 'Trip status is now IN PROGRESS. Safe journey!');
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
      'Complete Trip',
      `Have you arrived safely at ${trip?.destination || 'destination'}? This will mark the trip as COMPLETED.`,
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
                Alert.alert('Trip Completed!', 'Great job! This trip has been marked as COMPLETED.');
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
    if (problemDescription.trim().length < 3) {
      Alert.alert('Required', 'Please enter a description (at least 3 characters).');
      return;
    }

    setProblemSubmitting(true);
    try {
      const res = await apiService.reportProblem(id, {
        type: problemType,
        description: problemDescription.trim(),
      });
      if (res.success) {
        Alert.alert('Report Sent', 'Your problem report has been submitted to Operations.');
        setProblemModalVisible(false);
        setProblemDescription('');
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
        return { label: 'IN PROGRESS', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TRIP DETAILS</Text>
        <TouchableOpacity
          style={styles.problemIconBtn}
          onPress={() => setProblemModalVisible(true)}
        >
          <Text style={styles.problemIcon}>⚠️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Route Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeLabel}>ASSIGNED ROUTE</Text>
              <Text style={styles.routeOrigin}>{trip.origin}</Text>
              <Text style={styles.bannerArrow}> ↓ </Text>
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
          <Text style={styles.sectionTitle}>Trip Status Control</Text>

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
                <Text style={styles.primaryActionText}>START TRIP (DEPART)</Text>
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
                  <Text style={styles.primaryActionText}>COMPLETE TRIP (ARRIVE)</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportProblemBtn}
                onPress={() => setProblemModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.reportProblemBtnText}>⚠️ Report Route Problem / Delay</Text>
              </TouchableOpacity>
            </View>
          ) : trip.status === 'COMPLETED' ? (
            <View style={styles.completedNotice}>
              <Text style={styles.completedNoticeIcon}>✅</Text>
              <Text style={styles.completedNoticeTitle}>Trip Completed</Text>
              <Text style={styles.completedNoticeSub}>
                Arrival recorded at: {arr.date} {arr.time}
              </Text>
            </View>
          ) : (
            <View style={styles.cancelledNotice}>
              <Text style={styles.completedNoticeTitle}>Status: {trip.status}</Text>
            </View>
          )}
        </Animated.View>

        {/* Departure & Arrival Info */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
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
                <Text style={styles.infoLabel}>Expected Arrival</Text>
                <Text style={styles.infoValue}>{arr.date !== 'N/A' ? arr.date : 'En Route'}</Text>
              </View>
              <Text style={styles.timeHighlight}>{arr.time !== 'N/A' ? arr.time : '~TBD'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bus Information */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bus Model</Text>
              <Text style={styles.infoValue}>{trip.bus?.model || 'Standard Coach'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plate Number</Text>
              <View style={styles.plateTag}>
                <Text style={styles.plateText}>{trip.bus?.plateNumber || 'ETH-BUS'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>{trip.totalSeats || trip.bus?.capacity || 50} seats</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Booked Passengers</Text>
              <Text style={styles.infoValueHighlight}>{trip.bookedSeats || 0} / {trip.totalSeats || 50} Booked</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fare per Seat</Text>
              <Text style={styles.infoValueHighlight}>{trip.fare} ETB</Text>
            </View>
          </View>
        </Animated.View>

        {/* Existing Problem Reports for this trip */}
        {trip.problemReports && trip.problemReports.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.section}>
            <Text style={styles.sectionTitle}>Logged Trip Incidents</Text>
            {trip.problemReports.map((p) => (
              <View key={p.id} style={styles.tripProblemItem}>
                <View style={styles.tripProblemHeader}>
                  <Text style={styles.tripProblemType}>{p.type.replace(/_/g, ' ')}</Text>
                  <Text style={styles.tripProblemStatus}>{p.status}</Text>
                </View>
                <Text style={styles.tripProblemDesc}>{p.description}</Text>
                {p.notes ? (
                  <Text style={styles.tripProblemNotes}>Dispatch: {p.notes}</Text>
                ) : null}
              </View>
            ))}
          </Animated.View>
        )}

        {/* Incident Button (Always accessible) */}
        <TouchableOpacity
          style={styles.secondaryProblemBtn}
          onPress={() => setProblemModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryProblemText}>📢 Report Incident to Fleet Operations</Text>
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
              <Text style={styles.modalTitle}>Report Trip Incident</Text>
              <TouchableOpacity onPress={() => setProblemModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
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
                      <Text style={[styles.typeOptionText, isSelected && styles.typeOptionTextSelected]}>
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
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
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
  problemIconBtn: {
    padding: 6,
  },
  problemIcon: {
    fontSize: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  bannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeHeader: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  routeOrigin: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  bannerArrow: {
    fontSize: 14,
    color: '#94a3b8',
    marginVertical: 2,
  },
  routeDestination: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  primaryActionBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  startBtn: {
    backgroundColor: '#0f766e',
    shadowColor: '#0f766e',
  },
  completeBtn: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  reportProblemBtn: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  reportProblemBtnText: {
    color: '#e11d48',
    fontSize: 13,
    fontWeight: '700',
  },
  completedNotice: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  completedNoticeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  completedNoticeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 2,
  },
  completedNoticeSub: {
    fontSize: 12,
    color: '#64748b',
  },
  cancelledNotice: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoValueHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f766e',
  },
  timeHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f766e',
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
  secondaryProblemBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryProblemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  typeSelector: {
    gap: 8,
    marginBottom: 16,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  typeOptionTextSelected: {
    color: '#0f766e',
    fontWeight: '700',
  },
  problemInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 90,
    marginBottom: 20,
  },
  submitProblemBtn: {
    backgroundColor: '#e11d48',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitProblemBtnDisabled: {
    opacity: 0.6,
  },
  submitProblemBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  tripProblemItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  tripProblemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tripProblemType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  tripProblemStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
  },
  tripProblemDesc: {
    fontSize: 12,
    color: '#475569',
  },
  tripProblemNotes: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
