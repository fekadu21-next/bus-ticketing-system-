import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiService } from '@/services/api';
import type { PassengerBooking } from '@/types';
import PassengerTabBar from '@/components/PassengerTabBar';
import { useAuth } from '@/context/AuthContext';

type FilterTab = 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ALL';

export default function PassengerBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<PassengerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const passengerName = user?.firstName || 'Traveler';

  const fetchBookings = useCallback(async () => {
    try {
      const res = await apiService.getPassengerBookings();
      if (res.success && res.data?.bookings) {
        setBookings(res.data.bookings);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleCancelBooking = (booking: PassengerBooking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your seat #${booking.seatNumber} on ${booking.trip.operatorName} from ${booking.trip.origin} to ${booking.trip.destination}?`,
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(booking.id);
            try {
              const res = await apiService.cancelPassengerBooking(booking.id);
              if (res.success) {
                // Optimistically update status in state
                setBookings((prev) =>
                  prev.map((b) => (b.id === booking.id ? { ...b, status: 'CANCELLED' } : b))
                );
                Alert.alert('Booking Cancelled', 'Your ticket has been cancelled and seat released.');
              } else {
                Alert.alert('Error', res.error || 'Could not cancel booking.');
              }
            } catch {
              Alert.alert('Network Error', 'Failed to reach server. Please try again.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const handleShareTicket = async (b: PassengerBooking) => {
    try {
      const ticketRef = b.ticket?.ticketNumber || b.bookingNumber || b.id;
      await Share.share({
        title: `Bus Ticket - ${b.trip.origin} to ${b.trip.destination}`,
        message: `🎫 Ethiopian Intercity Bus Ticket\nOperator: ${b.trip.operatorName}\nRoute: ${b.trip.origin} → ${b.trip.destination}\nDeparture: ${b.trip.departureDate || 'Scheduled'} at ${b.trip.departureTime}\nSeat: #${b.seatNumber}\nTicket Ref: ${ticketRef}\nPassenger: ${b.passengerName || passengerName}\nStatus: ${b.status}`,
      });
    } catch {
      // User cancelled share
    }
  };

  // Counts for tabs
  const counts = useMemo(() => {
    let upcoming = 0;
    let completed = 0;
    let cancelled = 0;

    bookings.forEach((b) => {
      const s = (b.status || '').toUpperCase();
      if (s === 'CONFIRMED' || s === 'PENDING') upcoming++;
      else if (s === 'COMPLETED') completed++;
      else if (s === 'CANCELLED') cancelled++;
    });

    return {
      all: bookings.length,
      upcoming,
      completed,
      cancelled,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return bookings.filter((b) => {
      // 1. Tab filter
      const s = (b.status || '').toUpperCase();
      if (activeTab === 'UPCOMING' && s !== 'CONFIRMED' && s !== 'PENDING') return false;
      if (activeTab === 'COMPLETED' && s !== 'COMPLETED') return false;
      if (activeTab === 'CANCELLED' && s !== 'CANCELLED') return false;

      // 2. Search query filter
      if (!q) return true;
      const originMatch = (b.trip?.origin || '').toLowerCase().includes(q);
      const destMatch = (b.trip?.destination || '').toLowerCase().includes(q);
      const opMatch = (b.trip?.operatorName || '').toLowerCase().includes(q);
      const refMatch = (b.bookingNumber || b.id || '').toLowerCase().includes(q);
      const tktMatch = (b.ticket?.ticketNumber || '').toLowerCase().includes(q);
      const nameMatch = (b.passengerName || '').toLowerCase().includes(q);

      return originMatch || destMatch || opMatch || refMatch || tktMatch || nameMatch;
    });
  }, [bookings, activeTab, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'CONFIRMED', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'COMPLETED':
        return { label: 'TRAVELLED', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { label: 'PENDING', bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    }
  };

  const renderBookingCard = ({ item, index }: { item: PassengerBooking; index: number }) => {
    const statusStyle = getStatusBadge(item.status);
    const isUpcoming = item.status === 'CONFIRMED' || item.status === 'PENDING';
    const isCancelling = cancellingId === item.id;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(260)}>
        <View style={styles.card}>
          {/* Top Header: Operator & Status */}
          <View style={styles.cardHeader}>
            <View style={styles.operatorBlock}>
              <View style={styles.operatorRow}>
                <Text style={styles.operatorIcon}>🚌</Text>
                <Text style={styles.operatorName} numberOfLines={1}>
                  {item.trip.operatorName}
                </Text>
              </View>
              <Text style={styles.bookingNumber}>
                Ref: {item.bookingNumber || `BKG-${item.id.slice(0, 8)}`}
              </Text>
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

          {/* Journey Route & Time */}
          <View style={styles.routeBox}>
            <View style={styles.routeCol}>
              <Text style={styles.routeCity}>{item.trip.origin}</Text>
              <Text style={styles.timeText}>{item.trip.departureTime}</Text>
              <Text style={styles.dateText}>{item.trip.departureDate || 'Today'}</Text>
            </View>

            <View style={styles.arrowCol}>
              <Text style={styles.arrowIcon}>➔</Text>
              <Text style={styles.directLabel}>DIRECT</Text>
            </View>

            <View style={[styles.routeCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.routeCity}>{item.trip.destination}</Text>
              <Text style={styles.timeText}>{item.trip.arrivalTime || 'Arrival'}</Text>
              <Text style={styles.busMetaText}>
                {item.trip.busPlate || 'Coach'}
              </Text>
            </View>
          </View>

          {/* Passenger & Seat Details */}
          <View style={styles.detailRow}>
            <View style={styles.passengerInfo}>
              <Text style={styles.detailLabel}>PASSENGER</Text>
              <Text style={styles.passengerNameText} numberOfLines={1}>
                {item.passengerName || passengerName}
              </Text>
            </View>

            <View style={styles.seatBadge}>
              <Text style={styles.seatLabel}>SEAT</Text>
              <Text style={styles.seatNum}>#{item.seatNumber}</Text>
            </View>

            <View style={styles.fareInfo}>
              <Text style={styles.detailLabel}>FARE PAID</Text>
              <Text style={styles.fareAmountText}>{item.totalAmount} ETB</Text>
            </View>
          </View>

          {/* Card Action Buttons (View QR Ticket, Cancel, Share) */}
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={styles.viewTicketBtn}
              onPress={() =>
                router.push({
                  pathname: '/passenger/ticket/[id]',
                  params: {
                    id: item.ticket?.id || item.id,
                    bookingData: JSON.stringify(item),
                  },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.viewTicketIcon}>🎫</Text>
              <Text style={styles.viewTicketText}>View E-Ticket / QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => handleShareTicket(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>

            {isUpcoming && (
              <TouchableOpacity
                style={[styles.cancelBtn, isCancelling && { opacity: 0.6 }]}
                onPress={() => handleCancelBooking(item)}
                disabled={isCancelling}
                activeOpacity={0.7}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header matching Web My Bookings */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.greetingText}>Selam, {passengerName} 👋</Text>
          <Text style={styles.headerTitle}>My Bus Bookings</Text>
          <Text style={styles.headerSub}>Manage tickets, view boarding passes & statuses</Text>
        </View>

        <TouchableOpacity
          style={styles.bookNewBtn}
          onPress={() => router.push('/passenger/trips')}
          activeOpacity={0.8}
        >
          <Text style={styles.bookNewBtnText}>+ Book Bus</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by route, operator, or booking ref..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs with Badge Counts */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'UPCOMING' && styles.activeTab]}
          onPress={() => setActiveTab('UPCOMING')}
        >
          <Text style={[styles.tabText, activeTab === 'UPCOMING' && styles.activeTabText]}>
            Upcoming
          </Text>
          <View style={[styles.tabBadge, activeTab === 'UPCOMING' && styles.activeTabBadge]}>
            <Text style={[styles.tabBadgeText, activeTab === 'UPCOMING' && styles.activeTabBadgeText]}>
              {counts.upcoming}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'COMPLETED' && styles.activeTab]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.activeTabText]}>
            Completed
          </Text>
          <View style={[styles.tabBadge, activeTab === 'COMPLETED' && styles.activeTabBadge]}>
            <Text style={[styles.tabBadgeText, activeTab === 'COMPLETED' && styles.activeTabBadgeText]}>
              {counts.completed}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'CANCELLED' && styles.activeTab]}
          onPress={() => setActiveTab('CANCELLED')}
        >
          <Text style={[styles.tabText, activeTab === 'CANCELLED' && styles.activeTabText]}>
            Cancelled
          </Text>
          <View style={[styles.tabBadge, activeTab === 'CANCELLED' && styles.activeTabBadge]}>
            <Text style={[styles.tabBadgeText, activeTab === 'CANCELLED' && styles.activeTabBadgeText]}>
              {counts.cancelled}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ALL' && styles.activeTab]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>
            All
          </Text>
          <View style={[styles.tabBadge, activeTab === 'ALL' && styles.activeTabBadge]}>
            <Text style={[styles.tabBadgeText, activeTab === 'ALL' && styles.activeTabBadgeText]}>
              {counts.all}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.loadingText}>Syncing your travel reservations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎫</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? 'No matching tickets'
                  : activeTab === 'UPCOMING'
                  ? 'No upcoming trips'
                  : activeTab === 'COMPLETED'
                  ? 'No past trips'
                  : activeTab === 'CANCELLED'
                  ? 'No cancelled bookings'
                  : 'No bookings found'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? `No reservations found matching "${searchQuery}".`
                  : activeTab === 'UPCOMING'
                  ? 'You currently have no scheduled bus trips. Find available seats across Ethiopia!'
                  : 'Start planning your next comfortable intercity bus journey today.'}
              </Text>
              <TouchableOpacity
                style={styles.findBusesBtn}
                onPress={() => router.push('/passenger/trips')}
              >
                <Text style={styles.findBusesBtnText}>Search & Book Buses →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Bottom Passenger Tab Bar */}
      <PassengerTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  bookNewBtn: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bookNewBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#0f766e',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  activeTabBadgeText: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  operatorBlock: {
    flex: 1,
    marginRight: 8,
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  operatorIcon: {
    fontSize: 14,
  },
  operatorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  bookingNumber: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  routeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  routeCol: {
    flex: 1,
  },
  routeCity: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  busMetaText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  arrowCol: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  arrowIcon: {
    fontSize: 16,
    color: '#0f766e',
  },
  directLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  passengerInfo: {
    flex: 1.4,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  passengerNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  seatBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  seatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#059669',
  },
  seatNum: {
    fontSize: 13,
    fontWeight: '900',
    color: '#047857',
  },
  fareInfo: {
    alignItems: 'flex-end',
    flex: 1,
  },
  fareAmountText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f766e',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewTicketBtn: {
    flex: 1,
    backgroundColor: '#0f766e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  viewTicketIcon: {
    fontSize: 13,
  },
  viewTicketText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  shareBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shareBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#fff1f2',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
    minWidth: 64,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  findBusesBtn: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  findBusesBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
