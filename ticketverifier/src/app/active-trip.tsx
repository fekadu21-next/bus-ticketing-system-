import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export default function ActiveTripScreen() {
  const router = useRouter();
  const [trip, setTrip] = useState<ActiveTripInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrip() {
      const res = await apiService.getActiveTrip();
      if (res.success && res.data?.trip) {
        setTrip(res.data.trip);
      }
      setLoading(false);
    }
    fetchTrip();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ACTIVE TRIP</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Route Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.bannerCard}>
          <Text style={styles.bannerLabel}>ASSIGNED ROUTE</Text>
          <Text style={styles.cityText}>{trip?.origin || 'ADDIS ABABA'}</Text>
          <Text style={styles.bannerArrow}>↓</Text>
          <Text style={styles.cityText}>{trip?.destination || 'BAHIR DAR'}</Text>
        </Animated.View>

        {/* Trip Metadata Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Departure</Text>
            <Text style={styles.infoValueHighlight}>{trip?.departureTime || '06:00 AM'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Bus</Text>
            <View style={styles.plateTag}>
              <Text style={styles.plateText}>{trip?.busPlate || 'ET-1234'}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Capacity</Text>
            <Text style={styles.infoValue}>{trip?.totalSeats || 49} Seats</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Verified Passengers</Text>
            <Text style={styles.verifiedText}>{trip?.verifiedCount || 37}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Remaining to Board</Text>
            <Text style={styles.remainingText}>{trip?.remainingCount || 12}</Text>
          </View>
        </Animated.View>

        {/* Prominent Action Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.actionSection}>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push('/scan')}
            activeOpacity={0.88}
          >
            <Text style={styles.scanBtnIcon}>📷</Text>
            <Text style={styles.scanBtnText}>SCAN PASSENGER TICKET</Text>
          </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: '#0f766e',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerLabel: {
    fontSize: 11,
    color: '#99f6e4',
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  cityText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  bannerArrow: {
    fontSize: 20,
    color: '#99f6e4',
    marginVertical: 4,
    fontWeight: '900',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoValueHighlight: {
    fontSize: 16,
    fontWeight: '900',
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
    fontWeight: '800',
    color: '#0f172a',
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#16a34a',
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ea580c',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  actionSection: {
    marginTop: 8,
  },
  scanBtn: {
    flexDirection: 'row',
    backgroundColor: '#0f766e',
    paddingVertical: 18,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBtnIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
