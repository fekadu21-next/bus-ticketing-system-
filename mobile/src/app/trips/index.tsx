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
import { apiService, type DriverTrip } from '@/services/api';
import DriverTabBar from '@/components/DriverTabBar';

type FilterTab = 'ALL' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED';

export default function MyTripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [error, setError] = useState<string | null>(null);

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
        return { label: 'IN PROGRESS', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'PUBLISHED':
      case 'SCHEDULED':
        return { label: 'SCHEDULED', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { label: status, bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: 'N/A', time: 'N/A' };
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderTripItem = ({ item, index }: { item: DriverTrip; index: number }) => {
    const statusStyle = getStatusBadge(item.status);
    const { date, time } = formatDateTime(item.departureTime);

    return (
      <Animated.View entering={FadeInDown.duration(350).delay(index * 50)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.routeContainer}>
            <Text style={styles.routeCity}>{item.origin || 'Origin'}</Text>
            <Text style={styles.routeArrow}> → </Text>
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
            <Text style={styles.metaLabel}>📅 Date</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>⏰ Departure</Text>
            <Text style={styles.metaValue}>{time}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>🚌 Bus Plate</Text>
            <Text style={styles.metaValue}>{item.bus?.plateNumber || 'ETH-1234'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>💺 Capacity</Text>
            <Text style={styles.metaValue}>{item.bus?.capacity || 50} seats</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => router.push(`/trips/${item.id}` as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.detailsButtonText}>VIEW DETAILS</Text>
          <Text style={styles.detailsArrow}>→</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MY TRIPS</Text>
        <Text style={styles.headerSub}>Assigned Routes & Operations</Text>
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
              ? 'In Progress'
              : 'Completed';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.loadingText}>Fetching assigned trips...</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚌</Text>
              <Text style={styles.emptyTitle}>No Trips Found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'ALL'
                  ? 'Your operational manager has not assigned any trips to you yet.'
                  : `No trips found under '${filter.replace(/_/g, ' ')}' status.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Persistent Bottom Tab Bar */}
      <DriverTabBar />
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
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  activeTab: {
    backgroundColor: '#0f766e',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  routeCity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  routeArrow: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: 'bold',
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
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  tripMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  metaItem: {
    width: '47%',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 10,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginRight: 6,
    letterSpacing: 0.5,
  },
  detailsArrow: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
