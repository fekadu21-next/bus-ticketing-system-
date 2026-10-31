import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { apiService, type DriverTrip } from '@/services/api';
import DriverTabBar from '@/components/DriverTabBar';

const TEAL = '#0d9488';
const TEAL_DARK = '#0f766e';
const HEADER_BG = '#11423f';
const STRIP_BG = '#0d3835';

type FilterTab = 'ALL' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED';

export default function MyTripsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of driver session?', [
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

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const res = await apiService.getDriverTrips(filter === 'ALL' ? undefined : filter);
      if (res.success && res.data?.trips) {
        setTrips(res.data.trips);
      } else {
        setError(res.error || 'Failed to load assigned trips');
      }
    } catch {
      setError('Network error while loading trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchTrips();
  }, [fetchTrips]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'IN TRANSIT', bg: '#f0fdfa', text: TEAL_DARK, border: '#99f6e4' };
      case 'PUBLISHED':
      case 'SCHEDULED':
        return { label: 'SCHEDULED', bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { label: status, bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: '—', time: '—' };
    const d = new Date(dateStr);
    return {
      date: isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderTripItem = ({ item, index }: { item: DriverTrip; index: number }) => {
    const statusStyle = getStatusBadge(item.status);
    const { date, time } = formatDateTime(item.departureTime);

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 35)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.routeContainer}>
            <View style={[styles.cityDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.routeCity}>{item.origin || 'Addis Ababa'}</Text>
            <Text style={styles.routeArrow}>›</Text>
            <View style={[styles.cityDot, { backgroundColor: '#0284c7' }]} />
            <Text style={styles.routeCity}>{item.destination || 'Destination'}</Text>
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

        <View style={styles.cardDivider} />

        <View style={styles.tripMetaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Departure</Text>
            <Text style={styles.metaValue}>{date} {time ? `• ${time}` : ''}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Bus</Text>
            <Text style={[styles.metaValue, { color: TEAL_DARK, fontWeight: '800' }]}>
              {item.bus?.plateNumber || 'ETH-BUS'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Seats</Text>
            <Text style={styles.metaValue}>
              {item.bookedSeats ?? 0}/{item.bus?.capacity ?? item.totalSeats ?? 50}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => router.push(`/driver/trip/${item.id}` as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.detailsButtonText}>Trip Details</Text>
          <Text style={styles.detailsArrow}>›</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Assigned Trips</Text>
          <Text style={styles.headerSub}>Fleet Run Manifest</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.headerIconText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Role Strip */}
      <View style={styles.roleStrip}>
        <View style={styles.roleDot} />
        <Text style={styles.roleText}>DRIVER · FLEET RUNS</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {(['ALL', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED'] as FilterTab[]).map((tab) => {
          const isActive = filter === tab;
          const label =
            tab === 'ALL'
              ? 'All'
              : tab === 'PUBLISHED'
              ? 'Scheduled'
              : tab === 'IN_PROGRESS'
              ? 'In Transit'
              : 'Completed';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setFilter(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Fetching trips...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTrips}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚌</Text>
              <Text style={styles.emptyTitle}>No Trips Found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'ALL'
                  ? 'No scheduled departures assigned yet.'
                  : `No trips under '${filter.replace(/_/g, ' ')}' status.`}
              </Text>
            </View>
          }
        />
      )}

      <DriverTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: HEADER_BG,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 12, color: '#99f6e4', marginTop: 1 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 18 },

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

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeTab: { backgroundColor: '#f0fdfa', borderColor: TEAL },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: TEAL_DARK, fontWeight: '800' },

  listContent: { padding: 16, paddingBottom: 90 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  routeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cityDot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  routeArrow: { fontSize: 16, color: TEAL, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  cardDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },

  tripMetaGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 3, fontWeight: '600' },
  metaValue: { fontSize: 13, fontWeight: '700', color: '#0f172a' },

  detailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    gap: 4,
  },
  detailsButtonText: { fontSize: 12, fontWeight: '800', color: TEAL_DARK },
  detailsArrow: { fontSize: 14, color: TEAL_DARK, fontWeight: '900' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 13 },
  errorIcon: { fontSize: 32, marginBottom: 8 },
  errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center', marginBottom: 12 },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: TEAL },
  retryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },

  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: '#64748b', textAlign: 'center' },
});
