import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { apiService } from '@/services/api';

// ─── Colour palette ─────────────────────────────────────────────────
const SLATE_900 = '#0f172a';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const SLATE_50 = '#f8fafc';
const WHITE = '#ffffff';
const GREEN = '#059669';
const GREEN_50 = '#ecfdf5';
const GREEN_200 = '#a7f3d0';

// ─── Per-seat ticket shape ───────────────────────────────────────────
interface SeatTicket {
  id: string;
  ticketNumber: string;
  bookingId: string;
  seatNumber: number;
  status: string;
  qrToken: string;
  qrPayload: string;
}

export default function DigitalTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; bookingData?: string }>();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // activeTab: 'all' or `seat-{seatNumber}`
  const [activeTab, setActiveTab] = useState<string>('all');

  // ─── Load booking data ─────────────────────────────────────────────
  useEffect(() => {
    if (params.bookingData) {
      try {
        const parsed = JSON.parse(params.bookingData);
        setBooking(parsed);
        setLoading(false);
        return;
      } catch {
        // Fall back to API fetch
      }
    }

    async function loadBooking() {
      try {
        const res = await apiService.getPassengerBookings();
        if (res.success && res.data?.bookings) {
          const match = res.data.bookings.find(
            (b) => b.id === params.id || b.ticket?.id === params.id
          );
          setBooking(match ?? res.data.bookings[0] ?? null);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadBooking();
  }, [params.id, params.bookingData]);

  // ─── Derived fields ────────────────────────────────────────────────
  const origin = booking?.trip?.origin ?? booking?.booking?.origin ?? booking?.origin ?? 'Addis Ababa';
  const destination = booking?.trip?.destination ?? booking?.booking?.destination ?? booking?.destination ?? 'Destination';
  const departureDate = booking?.trip?.departureDate ?? booking?.booking?.departureDate ?? booking?.departureDate ?? 'Scheduled Date';
  const departureTime = booking?.trip?.departureTime ?? booking?.booking?.departureTime ?? booking?.departureTime ?? '06:00 AM';
  const operatorName = booking?.trip?.operatorName ?? booking?.booking?.operatorName ?? booking?.operatorName ?? 'Intercity Bus';
  const busPlate = booking?.trip?.busPlate ?? booking?.booking?.busPlate ?? booking?.busPlate ?? 'ET-3-1234';
  const passengerName =
    booking?.passengerInfo?.fullName ?? booking?.booking?.passengerName ?? booking?.passengerName ?? 'Passenger';
  const passengerPhone =
    booking?.passengerInfo?.phone ?? booking?.booking?.phone ?? booking?.phone ?? '';
  const paymentMethod =
    booking?.payment?.paymentMethod === 'TELEBIRR'
      ? 'Telebirr SuperApp'
      : booking?.payment?.paymentMethod === 'CHAPA'
      ? 'Chapa Gateway'
      : 'Electronic Payment';
  const totalFare =
    booking?.payment?.amount ?? booking?.booking?.totalFare ?? booking?.totalFare ?? booking?.trip?.price ?? 0;

  // ─── Build per-seat ticket list (matches web BookingConfirmationPage) ─
  const ticketsList: SeatTicket[] = useMemo(() => {
    const selectedSeats: number[] = Array.isArray(booking?.selectedSeats) && booking.selectedSeats.length > 0
      ? booking.selectedSeats
      : booking?.booking?.seatNumbers
        ? booking.booking.seatNumbers
        : booking?.booking?.seatNumber
          ? [booking.booking.seatNumber]
          : [1];

    const bookingId: string =
      booking?.booking?.id ?? booking?.id ?? params.id ?? 'BK-UNKNOWN';

    const baseTicketNumber: string =
      booking?.ticket?.ticketNumber ??
      booking?.ticketNumber ??
      `ET-BKT-${(bookingId).toString().substring(0, 8).toUpperCase()}`;

    const txRef: string = booking?.payment?.transactionReference ?? `TX-${bookingId}`;

    return selectedSeats.map((seatNum) => {
      const ticketNum = selectedSeats.length > 1
        ? `${baseTicketNumber}-S${seatNum}`
        : baseTicketNumber;

      const qrToken = `SECURE-PASS-${ticketNum}-SEAT${seatNum}`;

      // QR payload matches web BookingConfirmationPage.jsx format
      const qrPayload = JSON.stringify({
        verificationType: 'ETHIO_BUS_SECURE_TICKET',
        ticketNumber: ticketNum,
        bookingId,
        seatNumber: seatNum,
        passenger: passengerName,
        phone: passengerPhone,
        route: `${origin} → ${destination}`,
        departureDate,
        departureTime,
        operator: operatorName,
        busPlate,
        txRef,
        status: 'VALID',
      });

      return {
        id: `${bookingId}-seat${seatNum}`,
        ticketNumber: ticketNum,
        bookingId,
        seatNumber: seatNum,
        status: 'UNUSED',
        qrToken,
        qrPayload,
      };
    });
  }, [booking, params.id, origin, destination, departureDate, departureTime, operatorName, busPlate, passengerName, passengerPhone]);

  // Price per seat
  const pricePerSeat = ticketsList.length > 0 ? Math.round(totalFare / ticketsList.length) : totalFare;

  // ─── Share handler ─────────────────────────────────────────────────
  const handleShareTicket = async (ticket?: SeatTicket) => {
    const t = ticket ?? ticketsList[0];
    const seatText = ticket ? `Seat #${ticket.seatNumber}` : ticketsList.map((x) => `#${x.seatNumber}`).join(', ');
    const ticketNum = ticket?.ticketNumber ?? (ticketsList[0]?.ticketNumber ?? 'ET-TKT');
    try {
      await Share.share({
        title: `Official Boarding Pass: ${origin} → ${destination}`,
        message:
          `🎫 OFFICIAL ETHIOPIAN INTERCITY BUS TICKET\n` +
          `────────────────────────────\n` +
          `Ticket No : ${ticketNum}\n` +
          `Operator  : ${operatorName}\n` +
          `Route     : ${origin} → ${destination}\n` +
          `Departure : ${departureDate} at ${departureTime}\n` +
          `Seat(s)   : ${seatText}\n` +
          `Passenger : ${passengerName}\n` +
          `Fare Paid : ${totalFare.toLocaleString()} ETB\n` +
          `Payment   : ${paymentMethod}\n` +
          `Status    : ✓ VERIFIED & CONFIRMED\n` +
          `────────────────────────────\n` +
          `Present QR code at terminal for instant check-in.`,
      });
    } catch {
      // user cancelled
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────
  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.loadingText}>Generating your boarding passes...</Text>
      </SafeAreaView>
    );
  }

  // ─── Active ticket to display ──────────────────────────────────────
  const displayTickets: SeatTicket[] =
    activeTab === 'all'
      ? ticketsList
      : ticketsList.filter((t) => `seat-${t.seatNumber}` === activeTab);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/passenger/home')}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boarding Pass{ticketsList.length > 1 ? 'es' : ''}</Text>
        <TouchableOpacity style={styles.shareHeaderBtn} onPress={() => handleShareTicket()}>
          <Text style={styles.shareHeaderText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Success Banner ──────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.successBanner}>
          <Text style={styles.checkIcon}>✅</Text>
          <Text style={styles.successTitle}>Booking Confirmed & Verified!</Text>
          <Text style={styles.successSub}>
            {ticketsList.length > 1
              ? `${ticketsList.length} digital tickets issued. Present each QR code at the departure terminal.`
              : `Your digital ticket is registered. Present the QR code at the departure terminal.`}
          </Text>
        </Animated.View>

        {/* ── Tab Bar (only if multi-seat) ────────────────────────── */}
        {ticketsList.length > 1 && (
          <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.tabBarWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                  All Tickets ({ticketsList.length})
                </Text>
              </TouchableOpacity>
              {ticketsList.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tab, activeTab === `seat-${t.seatNumber}` && styles.tabActive]}
                  onPress={() => setActiveTab(`seat-${t.seatNumber}`)}
                >
                  <Text style={[styles.tabText, activeTab === `seat-${t.seatNumber}` && styles.tabTextActive]}>
                    Seat #{t.seatNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Ticket Cards (one per seat) ──────────────────────────── */}
        {displayTickets.map((ticket, index) => (
          <Animated.View
            key={ticket.id}
            entering={FadeInDown.duration(400).delay(150 + index * 80)}
            style={styles.ticketCard}
          >
            {/* ── Ticket Top Bar ─────────────────────────────────── */}
            <View style={styles.ticketTopBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.operatorTitle}>{operatorName}</Text>
                <Text style={styles.ticketNumberText}>{ticket.ticketNumber}</Text>
              </View>
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedTagText}>✓ CONFIRMED</Text>
              </View>
            </View>

            {/* ── Route Section ───────────────────────────────────── */}
            <View style={styles.routeSection}>
              <View style={styles.cityBlock}>
                <Text style={styles.cityLabel}>DEPARTURE</Text>
                <Text style={styles.cityName} numberOfLines={1}>{origin}</Text>
                <Text style={styles.citySubTime}>{departureTime}</Text>
              </View>
              <View style={styles.routeArrowCol}>
                <Text style={styles.arrowIcon}>➔</Text>
                <Text style={styles.directTag}>DIRECT</Text>
              </View>
              <View style={[styles.cityBlock, { alignItems: 'flex-end' }]}>
                <Text style={styles.cityLabel}>DESTINATION</Text>
                <Text style={styles.cityName} numberOfLines={1}>{destination}</Text>
                <Text style={styles.citySubTime}>Arrival</Text>
              </View>
            </View>

            {/* ── Perforated Divider ──────────────────────────────── */}
            <View style={styles.perforatedLine}>
              <View style={styles.notchLeft} />
              <View style={styles.dottedBar} />
              <View style={styles.notchRight} />
            </View>

            {/* ── Detail Grid ─────────────────────────────────────── */}
            <View style={styles.detailGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>PASSENGER</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{passengerName}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>SEAT #</Text>
                <Text style={[styles.detailValue, styles.seatHighlight]}>#{ticket.seatNumber}</Text>
              </View>
            </View>
            <View style={styles.detailGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>TRAVEL DATE</Text>
                <Text style={styles.detailValue}>{departureDate}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>VEHICLE PLATE</Text>
                <Text style={styles.detailValue}>{busPlate}</Text>
              </View>
            </View>
            <View style={styles.detailGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>PAYMENT METHOD</Text>
                <Text style={styles.detailValue}>{paymentMethod}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>FARE PAID</Text>
                <Text style={[styles.detailValue, styles.fareHighlight]}>
                  {pricePerSeat.toLocaleString()} ETB
                </Text>
              </View>
            </View>

            {/* ── QR Code Section ─────────────────────────────────── */}
            <View style={styles.qrSection}>
              <View style={styles.qrContainer}>
                <QRCode
                  value={ticket.qrPayload}
                  size={180}
                  color={SLATE_900}
                  backgroundColor={WHITE}
                />
              </View>
              <Text style={styles.qrInstruction}>
                Scan at the bus door for instant verifier validation
              </Text>
              <Text style={styles.qrTokenText} numberOfLines={2}>{ticket.qrToken}</Text>

              {/* Per-ticket share button */}
              {ticketsList.length > 1 && (
                <TouchableOpacity
                  style={styles.perTicketShareBtn}
                  onPress={() => handleShareTicket(ticket)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.perTicketShareText}>📤 Share Seat #{ticket.seatNumber} Pass</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        ))}

        {/* ── Action Buttons ──────────────────────────────────────── */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => handleShareTicket()}
            activeOpacity={0.85}
          >
            <Text style={styles.shareBtnText}>📤 Save / Share All Boarding Passes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.myBookingsBtn}
            onPress={() => router.replace('/passenger/bookings')}
            activeOpacity={0.85}
          >
            <Text style={styles.myBookingsBtnText}>🎫 View All My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/passenger/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.homeBtnText}>Back to Home Screen</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE_100 },
  centerContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SLATE_50,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: SLATE_600, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: SLATE_200,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: SLATE_100, justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 16, fontWeight: 'bold', color: SLATE_800 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: SLATE_900 },
  shareHeaderBtn: {
    backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  shareHeaderText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },

  scrollContent: { padding: 16 },

  // Success Banner
  successBanner: {
    backgroundColor: GREEN_50, borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: GREEN_200, marginBottom: 16,
  },
  checkIcon: { fontSize: 32, marginBottom: 6 },
  successTitle: { fontSize: 17, fontWeight: '900', color: '#065f46' },
  successSub: {
    fontSize: 12, color: '#047857', textAlign: 'center', marginTop: 4, lineHeight: 16,
  },

  // Tab bar
  tabBarWrap: { marginBottom: 14 },
  tabBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 2 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: WHITE, borderWidth: 1.5, borderColor: SLATE_200,
  },
  tabActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  tabText: { fontSize: 12, fontWeight: '700', color: SLATE_600 },
  tabTextActive: { color: WHITE },

  // Ticket card
  ticketCard: {
    backgroundColor: WHITE, borderRadius: 20, borderWidth: 1,
    borderColor: SLATE_200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    overflow: 'hidden', marginBottom: 20,
  },

  // Top bar
  ticketTopBar: {
    backgroundColor: SLATE_900, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  operatorTitle: { color: WHITE, fontSize: 16, fontWeight: '900' },
  ticketNumberText: { color: SLATE_400, fontSize: 11, fontWeight: '600', marginTop: 2 },
  verifiedTag: {
    backgroundColor: GREEN, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  verifiedTagText: { color: WHITE, fontSize: 10, fontWeight: '800' },

  // Route
  routeSection: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  cityBlock: { flex: 1 },
  cityLabel: { fontSize: 9, fontWeight: '800', color: SLATE_400, letterSpacing: 0.5 },
  cityName: { fontSize: 17, fontWeight: '900', color: SLATE_900, marginTop: 2 },
  citySubTime: { fontSize: 12, color: GREEN, fontWeight: '700', marginTop: 2 },
  routeArrowCol: { alignItems: 'center', paddingHorizontal: 10 },
  arrowIcon: { fontSize: 18, color: '#2563eb' },
  directTag: { fontSize: 9, fontWeight: '800', color: '#2563eb', marginTop: 2 },

  // Perforation
  perforatedLine: {
    flexDirection: 'row', alignItems: 'center', height: 24, position: 'relative',
  },
  notchLeft: {
    width: 14, height: 24, backgroundColor: SLATE_100,
    borderTopRightRadius: 12, borderBottomRightRadius: 12,
    borderWidth: 1, borderLeftWidth: 0, borderColor: SLATE_200,
  },
  dottedBar: {
    flex: 1, height: 1, borderStyle: 'dashed',
    borderWidth: 1, borderColor: SLATE_200, marginHorizontal: 4,
  },
  notchRight: {
    width: 14, height: 24, backgroundColor: SLATE_100,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
    borderWidth: 1, borderRightWidth: 0, borderColor: SLATE_200,
  },

  // Detail grid
  detailGrid: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '800', color: SLATE_400, letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontWeight: '700', color: SLATE_900, marginTop: 2 },
  seatHighlight: { fontSize: 18, fontWeight: '900', color: '#2563eb' },
  fareHighlight: { fontSize: 14, fontWeight: '900', color: GREEN },

  // QR
  qrSection: {
    alignItems: 'center', padding: 20,
    backgroundColor: SLATE_50, borderTopWidth: 1, borderTopColor: SLATE_100,
  },
  qrContainer: {
    padding: 12, backgroundColor: WHITE, borderRadius: 12,
    borderWidth: 1, borderColor: SLATE_200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  qrInstruction: {
    fontSize: 11, color: SLATE_600, textAlign: 'center',
    marginTop: 12, maxWidth: 260, lineHeight: 16,
  },
  qrTokenText: {
    fontSize: 9, color: SLATE_400,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 6, textAlign: 'center',
  },
  perTicketShareBtn: {
    marginTop: 12, paddingHorizontal: 18, paddingVertical: 8,
    backgroundColor: '#eff6ff', borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe',
  },
  perTicketShareText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },

  // Actions
  actionsCard: { gap: 10 },
  shareBtn: {
    backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  shareBtnText: { color: WHITE, fontSize: 14, fontWeight: '800' },
  myBookingsBtn: {
    backgroundColor: WHITE, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: SLATE_200,
  },
  myBookingsBtnText: { color: SLATE_900, fontSize: 14, fontWeight: '800' },
  homeBtn: { paddingVertical: 12, alignItems: 'center' },
  homeBtnText: { color: SLATE_600, fontSize: 13, fontWeight: '700' },
});
