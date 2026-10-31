import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiService, type RecentScanRecord } from '@/services/api';
import VerifierTabBar from '@/components/VerifierTabBar';

export default function RecentScansScreen() {
  const router = useRouter();
  const [scans, setScans] = useState<RecentScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = useCallback(async () => {
    const res = await apiService.getRecentScans();
    if (res.success && res.data?.scans) {
      setScans(res.data.scans);
    }
    setLoading(false);
    setRefreshing(false);
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
      <Animated.View entering={FadeInDown.duration(350).delay(index * 40)} style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.statusIndicator, isValid ? styles.validBg : isUsed ? styles.usedBg : styles.rejectBg]}>
            <Text style={styles.indicatorText}>{isValid ? '✓' : isUsed ? '⚠️' : '✕'}</Text>
          </View>

          <View style={styles.infoCol}>
            <View style={styles.headerLine}>
              <Text style={styles.ticketNum}>{item.ticketNumber}</Text>
              <Text style={styles.timestamp}>{item.scannedAt}</Text>
            </View>
            <Text style={styles.passengerName}>{item.passengerName} • Seat {item.seatNumber}</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RECENT SCANS</Text>
        <Text style={styles.headerSub}>Real-time Terminal Audit History</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id}
          renderItem={renderScanItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Scans Recorded Yet</Text>
              <Text style={styles.emptySub}>
                Tickets scanned by your terminal will appear here in chronological order.
              </Text>
            </View>
          }
        />
      )}

      {/* Persistent Bottom Tab Bar */}
      <VerifierTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  validBg: {
    backgroundColor: '#10b981',
  },
  usedBg: {
    backgroundColor: '#f59e0b',
  },
  rejectBg: {
    backgroundColor: '#ef4444',
  },
  indicatorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  infoCol: {
    flex: 1,
  },
  headerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  ticketNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  passengerName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 2,
  },
  routeText: {
    fontSize: 11,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  validBadge: {
    backgroundColor: '#ecfdf5',
  },
  usedBadge: {
    backgroundColor: '#fffbeb',
  },
  rejectBadge: {
    backgroundColor: '#fef2f2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  validText: {
    color: '#059669',
  },
  usedText: {
    color: '#d97706',
  },
  rejectText: {
    color: '#dc2626',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
