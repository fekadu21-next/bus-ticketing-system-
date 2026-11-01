import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiService, type RecentScanRecord } from '@/services/api';
import VerifierTabBar from '@/components/VerifierTabBar';

const TEAL = '#0d9488';
const HEADER_BG = '#11423f';
const STRIP_BG = '#0d3835';

export default function RecentScansScreen() {
  const router = useRouter();
  const [scans, setScans] = useState<RecentScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = useCallback(async () => {
    try {
      const res = await apiService.getRecentScans();
      if (res.success && res.data?.scans) {
        setScans(res.data.scans);
      }
    } catch (err) {
      console.warn('Recent scans fetch notice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchScans();
  };

  const renderScanItem = ({ item, index }: { item: RecentScanRecord; index: number }) => {
    const isValid = item.status === 'VALID';
    const isUsed = item.status === 'ALREADY_USED';

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 35)} style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.statusIndicator, isValid ? styles.validBg : isUsed ? styles.usedBg : styles.rejectBg]}>
            <Text style={styles.indicatorText}>{isValid ? '✓' : isUsed ? '⚠️' : '✕'}</Text>
          </View>

          <View style={styles.infoCol}>
            <View style={styles.headerLine}>
              <Text style={styles.ticketNum}>{item.ticketNumber}</Text>
              <Text style={styles.timestamp}>{item.scannedAt}</Text>
            </View>
            <Text style={styles.passengerName}>
              {item.passengerName} • Seat {item.seatNumber}
            </Text>
            <Text style={styles.routeText}>{item.route}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isValid ? styles.validBadge : isUsed ? styles.usedBadge : styles.rejectBadge,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isValid ? styles.validText : isUsed ? styles.usedText : styles.rejectText,
              ]}
            >
              {item.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Matching Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
        <Text style={styles.headerSub}>Real-Time Verification Log</Text>
      </View>

      {/* Role Strip */}
      <View style={styles.roleStrip}>
        <View style={styles.roleDot} />
        <Text style={styles.roleText}>TICKET VERIFIER · TERMINAL LOGS</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Fetching scan logs...</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id}
          renderItem={renderScanItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Scans Yet</Text>
              <Text style={styles.emptySub}>
                Tickets validated with the scanner will appear here in real-time.
              </Text>
            </View>
          }
        />
      )}

      <VerifierTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: HEADER_BG,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 12, color: '#99f6e4', marginTop: 1 },

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

  listContent: { padding: 16, paddingBottom: 90 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  validBg: { backgroundColor: '#10b981' },
  usedBg: { backgroundColor: '#f59e0b' },
  rejectBg: { backgroundColor: '#ef4444' },
  indicatorText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },

  infoCol: { flex: 1 },
  headerLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  ticketNum: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  timestamp: { fontSize: 11, color: '#94a3b8' },
  passengerName: { fontSize: 12, color: '#334155', fontWeight: '600' },
  routeText: { fontSize: 11, color: '#64748b', marginTop: 1 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, marginLeft: 8 },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  validBadge: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  validText: { color: '#15803d' },
  usedBadge: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  usedText: { color: '#b45309' },
  rejectBadge: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  rejectText: { color: '#b91c1c' },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 13 },

  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },
});
