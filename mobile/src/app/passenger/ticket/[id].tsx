import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { apiService } from '@/services/api';
import type { PassengerBooking } from '@/types';

export default function DigitalTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; bookingData?: string }>();

  const [booking, setBooking] = useState<PassengerBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.bookingData) {
      try {
        const parsed = JSON.parse(params.bookingData) as PassengerBooking;
        setBooking(parsed);
        setLoading(false);
        return;
      } catch {
        // Fall back to fetch
      }
    }

    async function loadBooking() {
      try {
        const res = await apiService.getPassengerBookings();
        if (res.success && res.data?.bookings) {
          const match = res.data.bookings.find(
            (b) => b.id === params.id || b.ticket?.id === params.id
          );
          if (match) {
            setBooking(match);
          } else {
            setBooking(res.data.bookings[0]);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    void loadBooking();
  }, [params.id, params.bookingData]);

  const handleShare = async () => {
    if (!booking) return;
    try {
      await Share.share({
        message: `🎫 Ethiopia Bus Ticket\nTicket: ${booking.ticket?.ticketNumber || 'TKT-ETH'}\nRoute: ${booking.trip.origin} → ${booking.trip.destination}\nSeat: #${booking.seatNumber}\nDeparture: ${booking.trip.departureTime}\nOperator: ${booking.trip.operatorName}`,
      });
    } catch {
      // Ignore
    }
  };

  const [cancelling, setCancelling] = useState(false);

  const handleCancelReservation = () => {
    if (!booking) return;

    Alert.alert(
      'Cancel Reservation',
      `Are you sure you want to cancel this ticket for ${booking.trip.origin} → ${booking.trip.destination}? Your seat will be released.`,
      [
        { text: 'Keep Ticket', style: 'cancel' },
        {
          text: 'Cancel Reservation',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await apiService.cancelPassengerBooking(booking.id);
              if (res.success) {
                setBooking((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
                Alert.alert(
                  'Reservation Cancelled',
                  'Your booking has been cancelled and seat released.',
                  [
                    {
                      text: 'Go to My Bookings',
                      onPress: () => router.replace('/passenger/bookings'),
                    },
                  ]
                );
              } else {
                Alert.alert('Error', res.error || 'Failed to cancel reservation.');
              }
            } catch {
              Alert.alert('Network Error', 'Could not reach server to cancel reservation.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Generating Boarding Pass...</Text>
      </SafeAreaView>
    );
  }

  const ticketRef =
    booking.ticket?.ticketNumber || `TKT-${booking.id.substring(0, 8).toUpperCase()}`;

  const qrPayload = JSON.stringify({
    verificationType: 'ETHIO_BUS_SECURE_TICKET',
    bookingId: booking.id,
    ticketNumber: ticketRef,
    passenger: booking.passengerName || 'Passenger',
    phone: booking.phone || '',
    route: `${booking.trip.origin} → ${booking.trip.destination}`,
    departureDate: booking.trip.departureDate || 'Scheduled',
    departureTime: booking.trip.departureTime,
    seats: [booking.seatNumber],
    operator: booking.trip.operatorName,
    amount: booking.totalAmount,
    status: booking.status,
    qrToken: booking.ticket?.qrToken || ticketRef,
    issuedAt: booking.createdAt || new Date().toISOString(),
  });

  const isConfirmed = booking.status === 'CONFIRMED' || booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/passenger/bookings')}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Boarding Pass</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.ticketCard}>
          {/* Operator Header */}
          <View style={styles.ticketHeader}>
            <View style={styles.operatorRow}>
              <View style={styles.operatorLogoBadge}>
                <Text style={styles.operatorLogoIcon}>🚌</Text>
              </View>
              <View>
                <Text style={styles.ticketOperatorName}>{booking.trip.operatorName}</Text>
                <Text style={styles.ticketCategory}>Express Intercity Coach</Text>
              </View>
            </View>
            <View
              style={[
                styles.activeStatusBadge,
                isCancelled && { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
              ]}
            >
              <Text
                style={[
                  styles.activeStatusText,
                  isCancelled && { color: '#dc2626' },
                ]}
              >
                {isCancelled ? 'CANCELLED' : 'VERIFIED'}
              </Text>
            </View>
          </View>

          {/* Route Section */}
          <View style={styles.routeSection}>
            <View style={styles.cityBlock}>
              <Text style={styles.cityCode}>{booking.trip.origin.slice(0, 3).toUpperCase()}</Text>
              <Text style={styles.cityName}>{booking.trip.origin}</Text>
              <Text style={styles.timeTag}>{booking.trip.departureTime}</Text>
            </View>

            <View style={styles.arrowBlock}>
              <Text style={styles.arrowSymbol}>➔</Text>
              <View style={styles.routeDottedLine} />
              <Text style={styles.directLabel}>DIRECT</Text>
            </View>

            <View style={[styles.cityBlock, { alignItems: 'flex-end' }]}>
              <Text style={styles.cityCode}>{booking.trip.destination.slice(0, 3).toUpperCase()}</Text>
              <Text style={styles.cityName}>{booking.trip.destination}</Text>
              <Text style={styles.timeTag}>{booking.trip.arrivalTime || '02:30 PM'}</Text>
            </View>
          </View>

          {/* Perforated Separator with Side Notches */}
          <View style={styles.perforatedWrap}>
            <View style={[styles.notch, styles.notchLeft]} />
            <View style={styles.perforatedLine} />
            <View style={[styles.notch, styles.notchRight]} />
          </View>

          {/* Passenger & Seat Details */}
          <View style={styles.ticketDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>PASSENGER</Text>
                <Text style={styles.detailValue}>{booking.passengerName || 'Passenger'}</Text>
              </View>
              <View style={[styles.detailCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.detailLabel}>ASSIGNED SEAT</Text>
                <View style={styles.seatBadge}>
                  <Text style={styles.seatBadgeText}>SEAT #{booking.seatNumber}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>TRAVEL DATE</Text>
                <Text style={styles.detailValue}>{booking.trip.departureDate || 'Today'}</Text>
              </View>
              <View style={[styles.detailCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.detailLabel}>BUS PLATE</Text>
                <Text style={styles.detailValue}>{booking.trip.busPlate || 'ETH-BUS'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>TICKET NUMBER</Text>
                <Text style={[styles.detailValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                  {ticketRef}
                </Text>
              </View>
              <View style={[styles.detailCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.detailLabel}>FARE PAID</Text>
                <Text style={[styles.detailValue, { color: '#0f766e', fontWeight: '900' }]}>
                  {booking.totalAmount} ETB
                </Text>
              </View>
            </View>
          </View>

          {/* QR Code Boarding Pass Area */}
          <View style={styles.qrSection}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrPayload}
                size={180}
                color={isCancelled ? '#94a3b8' : '#0f172a'}
                backgroundColor="#ffffff"
              />
            </View>
            <Text style={styles.qrInstruction}>
              {isCancelled
                ? 'This ticket has been cancelled and is no longer valid for boarding.'
                : 'Show this QR code to the Ticket Verifier at the terminal gate before boarding.'}
            </Text>
            <Text style={styles.tokenText}>{ticketRef}</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.allBookingsBtn}
            onPress={() => router.replace('/passenger/bookings')}
            activeOpacity={0.8}
          >
            <Text style={styles.allBookingsBtnText}>🎫 My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/passenger/trips')}
            activeOpacity={0.8}
          >
            <Text style={styles.homeBtnText}>🔍 Find Another Bus</Text>
          </TouchableOpacity>
        </View>

        {/* Cancellation CTA if active */}
        {isConfirmed && (
          <TouchableOpacity
            style={styles.cancelTicketBtn}
            onPress={handleCancelReservation}
            disabled={cancelling}
            activeOpacity={0.7}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.cancelTicketBtnText}>✕ Cancel This Reservation</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f766e',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  operatorLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorLogoIcon: {
    fontSize: 18,
  },
  ticketOperatorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  ticketCategory: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  activeStatusBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  activeStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  routeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  cityBlock: {
    flex: 1,
  },
  cityCode: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
  },
  cityName: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  timeTag: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f766e',
    marginTop: 4,
  },
  arrowBlock: {
    flex: 1.2,
    alignItems: 'center',
  },
  arrowSymbol: {
    fontSize: 16,
    color: '#0f766e',
    transform: [{ rotate: '90deg' }],
    marginBottom: 4,
  },
  routeDottedLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#cbd5e1',
  },
  directLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    marginTop: 4,
  },
  perforatedWrap: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  perforatedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginHorizontal: 20,
  },
  notch: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0f766e',
  },
  notchLeft: {
    left: -10,
  },
  notchRight: {
    right: -10,
  },
  ticketDetails: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  seatBadge: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seatBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  qrSection: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  qrInstruction: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  tokenText: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  homeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  allBookingsBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  allBookingsBtnText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelTicketBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTicketBtnText: {
    color: '#fee2e2',
    fontSize: 13,
    fontWeight: '800',
  },
});
