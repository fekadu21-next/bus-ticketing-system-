import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { type VerificationResultData } from '@/data/mockVerifierData';

export default function VerificationResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resultData: string }>();

  let result: VerificationResultData;
  try {
    result = params.resultData
      ? JSON.parse(params.resultData)
      : {
          status: 'VALID',
          allowed: true,
          passengerName: 'Abebe Kebede',
          ticketNumber: 'TKT-000123',
          route: 'Addis Ababa → Bahir Dar',
          seatNumber: 12,
          verifiedAt: '06:12 AM',
          message: 'TICKET VALID — BOARDING ALLOWED',
        };
  } catch {
    result = {
      status: 'INVALID',
      allowed: false,
      ticketNumber: 'UNKNOWN',
      verifiedAt: 'Now',
      message: 'INVALID TICKET',
    };
  }

  const isAllowed = result.allowed;
  const status = result.status;

  const getTheme = () => {
    switch (status) {
      case 'VALID':
        return {
          bg: '#ecfdf5',
          bannerBg: '#059669',
          icon: '✓',
          badgeText: 'BOARDING ALLOWED',
          badgeBg: '#10b981',
          title: 'TICKET VALID',
        };
      case 'ALREADY_USED':
        return {
          bg: '#fffbeb',
          bannerBg: '#d97706',
          icon: '⚠️',
          badgeText: 'BOARDING NOT ALLOWED',
          badgeBg: '#f59e0b',
          title: 'TICKET ALREADY USED',
        };
      case 'WRONG_TRIP':
        return {
          bg: '#fff7ed',
          bannerBg: '#ea580c',
          icon: '✕',
          badgeText: 'BOARDING NOT ALLOWED',
          badgeBg: '#ea580c',
          title: 'WRONG TRIP',
        };
      case 'CANCELLED':
        return {
          bg: '#fef2f2',
          bannerBg: '#dc2626',
          icon: '✕',
          badgeText: 'BOARDING NOT ALLOWED',
          badgeBg: '#dc2626',
          title: 'TICKET CANCELLED',
        };
      case 'INVALID':
      default:
        return {
          bg: '#fef2f2',
          bannerBg: '#b91c1c',
          icon: '✕',
          badgeText: 'BOARDING NOT ALLOWED',
          badgeBg: '#b91c1c',
          title: 'INVALID TICKET',
        };
    }
  };

  const theme = getTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* RESULT HERO BADGE */}
        <Animated.View entering={ZoomIn.duration(400)} style={styles.heroWrap}>
          <View style={[styles.iconCircle, { backgroundColor: theme.bannerBg }]}>
            <Text style={styles.iconText}>{theme.icon}</Text>
          </View>
          <Text style={[styles.resultTitle, { color: theme.bannerBg }]}>{theme.title}</Text>
          <View style={[styles.allowedPill, { backgroundColor: theme.badgeBg }]}>
            <Text style={styles.allowedPillText}>{theme.badgeText}</Text>
          </View>
        </Animated.View>

        {/* DETAILS CARD */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.card}>
          {status === 'VALID' ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Passenger</Text>
                <Text style={styles.value}>{result.passengerName || 'Abebe Kebede'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Ticket</Text>
                <Text style={styles.valueHighlight}>{result.ticketNumber || 'TKT-000123'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Route</Text>
                <Text style={styles.value}>{result.route || 'Addis Ababa → Bahir Dar'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Seat</Text>
                <View style={styles.seatBadge}>
                  <Text style={styles.seatBadgeText}>Seat {result.seatNumber || '12'}</Text>
                </View>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Verification Time</Text>
                <Text style={styles.value}>{result.verifiedAt || '06:12 AM'}</Text>
              </View>
            </>
          ) : status === 'ALREADY_USED' ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ticket Number</Text>
                <Text style={styles.valueHighlight}>{result.ticketNumber}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Passenger</Text>
                <Text style={styles.value}>{result.passengerName || 'Kaleb Worku'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Verified Previously</Text>
                <Text style={styles.warningValue}>{result.previousVerificationTime || '05:58 AM'}</Text>
              </View>
              <View style={styles.divider} />

              <Text style={styles.rejectNotice}>
                ⚠️ Duplicate Entry Alert: This boarding pass has already been used and cannot be scanned twice.
              </Text>
            </>
          ) : status === 'WRONG_TRIP' ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ticket Number</Text>
                <Text style={styles.valueHighlight}>{result.ticketNumber}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Ticket Belongs To</Text>
                <Text style={styles.wrongValue}>{result.ticketTrip || 'Addis Ababa → Gondar'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Current Trip</Text>
                <Text style={styles.value}>{result.currentTrip || 'Addis Ababa → Bahir Dar'}</Text>
              </View>
              <View style={styles.divider} />

              <Text style={styles.rejectNotice}>
                ✕ Trip Mismatch: Passenger is attempting to board the wrong bus route.
              </Text>
            </>
          ) : status === 'CANCELLED' ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ticket Number</Text>
                <Text style={styles.valueHighlight}>{result.ticketNumber}</Text>
              </View>
              <View style={styles.divider} />

              <Text style={styles.rejectNotice}>
                ✕ Cancelled Ticket: This reservation was cancelled or refunded and is no longer valid for travel.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Scan Result</Text>
                <Text style={styles.wrongValue}>Unknown / Invalid Signature</Text>
              </View>
              <View style={styles.divider} />

              <Text style={styles.rejectNotice}>
                ✕ The ticket QR token could not be verified by the system.
              </Text>
            </>
          )}
        </Animated.View>

        {/* BOTTOM ACTION BUTTONS */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.btnRow}>
          {isAllowed ? (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.replace('/scan')}
              activeOpacity={0.88}
            >
              <Text style={styles.doneBtnText}>✓ DONE — SCAN NEXT TICKET</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.scanAgainBtn}
              onPress={() => router.replace('/scan')}
              activeOpacity={0.88}
            >
              <Text style={styles.scanAgainBtnText}>📷 SCAN AGAIN</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={() => router.replace('/dashboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  iconText: {
    fontSize: 44,
    color: '#ffffff',
    fontWeight: '900',
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  allowedPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  allowedPillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  valueHighlight: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f766e',
  },
  warningValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#d97706',
  },
  wrongValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ea580c',
  },
  seatBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seatBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  rejectNotice: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
    marginTop: 10,
    lineHeight: 18,
  },
  btnRow: {
    gap: 12,
  },
  doneBtn: {
    backgroundColor: '#059669',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scanAgainBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanAgainBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dashboardBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dashboardBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
