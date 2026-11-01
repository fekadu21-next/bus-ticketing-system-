import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { type VerificationResultData } from '@/types';

export default function VerificationResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resultData: string }>();

  let result: VerificationResultData;
  try {
    result = params.resultData
      ? JSON.parse(params.resultData)
      : {
          status: 'INVALID',
          allowed: false,
          ticketNumber: 'N/A',
          verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message: 'No scan data received',
        };
  } catch {
    result = {
      status: 'INVALID',
      allowed: false,
      ticketNumber: 'UNKNOWN',
      verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: 'Failed to parse verification result',
    };
  }

  const isAllowed = result.allowed;
  const status = result.status;

  const getTheme = () => {
    switch (status) {
      case 'VALID':
        return {
          bg: '#f8fafc',
          bannerBg: '#0f766e',
          icon: '✓',
          badgeText: 'BOARDING ALLOWED',
          badgeBg: '#15803d',
          title: 'TICKET VALID',
        };
      case 'ALREADY_USED':
        return {
          bg: '#f8fafc',
          bannerBg: '#b45309',
          icon: '⚠️',
          badgeText: 'ALREADY SCANNED',
          badgeBg: '#d97706',
          title: 'ALREADY USED',
        };
      case 'WRONG_TRIP':
        return {
          bg: '#f8fafc',
          bannerBg: '#c2410c',
          icon: '✕',
          badgeText: 'WRONG BUS / ROUTE',
          badgeBg: '#ea580c',
          title: 'WRONG TRIP',
        };
      case 'CANCELLED':
        return {
          bg: '#f8fafc',
          bannerBg: '#b91c1c',
          icon: '✕',
          badgeText: 'TICKET REFUNDED',
          badgeBg: '#dc2626',
          title: 'CANCELLED',
        };
      case 'INVALID':
      default:
        return {
          bg: '#f8fafc',
          bannerBg: '#991b1b',
          icon: '✕',
          badgeText: 'INVALID SIGNATURE',
          badgeBg: '#b91c1c',
          title: 'INVALID TICKET',
        };
    }
  };

  const theme = getTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bannerBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/verifier/scan')} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* RESULT HERO BADGE */}
        <Animated.View entering={ZoomIn.duration(350)} style={styles.heroWrap}>
          <View style={[styles.iconCircle, { backgroundColor: theme.bannerBg }]}>
            <Text style={styles.iconText}>{theme.icon}</Text>
          </View>
          <Text style={[styles.resultTitle, { color: theme.bannerBg }]}>{theme.title}</Text>
          <View style={[styles.allowedPill, { backgroundColor: theme.badgeBg }]}>
            <Text style={styles.allowedPillText}>{theme.badgeText}</Text>
          </View>
        </Animated.View>

        {/* DETAILS CARD */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.card}>
          {status === 'VALID' ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Passenger</Text>
                <Text style={styles.value}>{result.passengerName || 'Passenger'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Ticket #</Text>
                <Text style={styles.valueHighlight}>{result.ticketNumber || 'TKT-000123'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Route</Text>
                <Text style={styles.value}>{result.route || 'Scheduled Route'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Assigned Seat</Text>
                <View style={styles.seatBadge}>
                  <Text style={styles.seatBadgeText}>Seat {result.seatNumber || '—'}</Text>
                </View>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Boarding Timestamp</Text>
                <Text style={styles.value}>{result.verifiedAt || 'Just now'}</Text>
              </View>
            </>
          ) : status === 'ALREADY_USED' ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ticket #</Text>
                <Text style={styles.valueHighlight}>{result.ticketNumber}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Passenger</Text>
                <Text style={styles.value}>{result.passengerName || 'Passenger'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Initial Scan</Text>
                <Text style={styles.warningValue}>{result.previousVerificationTime || 'Previously scanned'}</Text>
              </View>
              <View style={styles.divider} />

              <Text style={styles.rejectNotice}>
                ⚠️ This boarding pass has already been checked in.
              </Text>
            </>
          ) : status === 'WRONG_TRIP' ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ticket #</Text>
                <Text style={styles.valueHighlight}>{result.ticketNumber}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Ticket Belongs To</Text>
                <Text style={styles.wrongValue}>{result.ticketTrip || 'Other Route'}</Text>
              </View>
              <View style={styles.divider} />

              <Text style={styles.rejectNotice}>
                ✕ Passenger is boarding a different bus route.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Result</Text>
                <Text style={styles.wrongValue}>Invalid Signature</Text>
              </View>
              <View style={styles.divider} />

              <Text style={styles.rejectNotice}>
                ✕ QR code could not be verified by the ticketing database.
              </Text>
            </>
          )}
        </Animated.View>

        {/* ACTION BUTTONS */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.btnRow}>
          {isAllowed ? (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.replace('/verifier/scan')}
              activeOpacity={0.88}
            >
              <Text style={styles.doneBtnText}>✓ Scan Next Ticket</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.scanAgainBtn}
              onPress={() => router.replace('/verifier/scan')}
              activeOpacity={0.88}
            >
              <Text style={styles.scanAgainBtnText}>📷 Scan Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={() => router.replace('/verifier/dashboard')}
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: '#ffffff', fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },

  scrollContent: { padding: 20, paddingBottom: 40 },
  heroWrap: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  iconText: { fontSize: 38, color: '#ffffff', fontWeight: '900' },
  resultTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5, marginBottom: 6, textAlign: 'center' },
  allowedPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16 },
  allowedPillText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  label: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  valueHighlight: { fontSize: 14, fontWeight: '800', color: '#0f766e' },
  warningValue: { fontSize: 14, fontWeight: '800', color: '#d97706' },
  wrongValue: { fontSize: 14, fontWeight: '800', color: '#ea580c' },
  seatBadge: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  seatBadgeText: { fontSize: 13, fontWeight: '900', color: '#0f766e' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  rejectNotice: { fontSize: 12, color: '#991b1b', fontWeight: '600', marginTop: 10, lineHeight: 16 },

  btnRow: { gap: 10 },
  doneBtn: {
    backgroundColor: '#0d9488',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  scanAgainBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanAgainBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  dashboardBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  dashboardBtnText: { color: '#475569', fontSize: 13, fontWeight: '700' },
});
