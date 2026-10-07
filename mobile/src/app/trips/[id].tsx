import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { apiService, type DriverTrip } from '@/services/api';

export default function TripDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'IN PROGRESS', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'PUBLISHED':
      case 'SCHEDULED':
        return { label: 'PUBLISHED', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
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
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Route Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeLabel}>Route</Text>
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
                <Text style={styles.primaryActionText}>START TRIP</Text>
              )}
            </TouchableOpacity>
          ) : trip.status === 'IN_PROGRESS' ? (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.completeBtn]}
              onPress={handleCompleteTrip}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryActionText}>COMPLETE TRIP</Text>
              )}
            </TouchableOpacity>
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
                <Text style={styles.infoLabel}>Departure</Text>
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
          <Text style={styles.sectionTitle}>Bus Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model</Text>
              <Text style={styles.infoValue}>{trip.bus?.model || 'Toyota / XYZ Coach'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plate Number</Text>
              <View style={styles.plateTag}>
                <Text style={styles.plateText}>{trip.bus?.plateNumber || 'ET-1234'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>{trip.totalSeats || trip.bus?.capacity || 49} seats</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trip Status</Text>
              <Text style={styles.statusValueText}>{trip.status}</Text>
            </View>
          </View>
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerRightPlaceholder: {
    width: 32,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: '#0f766e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    fontSize: 12,
    color: '#99f6e4',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  routeOrigin: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  bannerArrow: {
    fontSize: 18,
    color: '#99f6e4',
    marginVertical: 2,
    fontWeight: 'bold',
  },
  routeDestination: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  primaryActionBtn: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  startBtn: {
    backgroundColor: '#0284c7',
  },
  completeBtn: {
    backgroundColor: '#16a34a',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.8,
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
    marginBottom: 6,
  },
  completedNoticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 2,
  },
  completedNoticeSub: {
    fontSize: 12,
    color: '#166534',
  },
  cancelledNotice: {
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 12,
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
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  timeHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f766e',
  },
  plateTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  plateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
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
});
