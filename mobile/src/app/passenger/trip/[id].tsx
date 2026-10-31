import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { apiService } from '@/services/api';
import type { PassengerTrip, SeatInfo } from '@/types';
import { useAuth } from '@/context/AuthContext';

const PRIMARY = '#2563eb';
const ROSE = '#2563eb';
const PRIMARY_DARK = '#1d4ed8';
const ROSE_DARK = '#1d4ed8';
const GREEN = '#059669';
const SLATE_900 = '#0f172a';
const SLATE_800 = '#1e293b';
const SLATE_700 = '#334155';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_100 = '#f1f5f9';
const SLATE_50 = '#f8fafc';
const WHITE = '#ffffff';

export default function TripSeatSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [trip, setTrip] = useState<PassengerTrip | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter to view only available seats
  const [onlyAvailableFilter, setOnlyAvailableFilter] = useState(false);

  // Passenger form fields (matches web app flow)
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');

  useEffect(() => {
    if (user) {
      if (user.firstName && !firstName) setFirstName(user.firstName);
      if (user.lastName && !lastName) setLastName(user.lastName);
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user, firstName, lastName, email, phone]);

  useEffect(() => {
    async function loadTripAndSeats() {
      if (!id) return;
      try {
        const res = await apiService.getPassengerTripDetails(id);
        if (res.success && res.data) {
          setTrip(res.data.trip);
          setSeats(res.data.seats);
          setPickupLocation(`${res.data.trip.origin} Main Station`);
          setDropoffLocation(`${res.data.trip.destination} Bus Station`);

          // Auto-select first available seat
          const firstAvailable = res.data.seats.find((s) => !s.isBooked && s.status === 'AVAILABLE');
          if (firstAvailable) {
            setSelectedSeats([firstAvailable.seatNumber]);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    void loadTripAndSeats();
  }, [id]);

  // Available seats list for quick selection
  const availableSeats = useMemo(() => {
    return seats.filter((s) => !s.isBooked && s.status === 'AVAILABLE');
  }, [seats]);

  const toggleSeat = (seatNumber: number, isBooked: boolean, status?: string) => {
    const isUnavailable = isBooked || status !== 'AVAILABLE';
    if (isUnavailable) {
      Alert.alert(
        'Seat Unavailable',
        `Seat #${seatNumber} is ${status === 'HELD' || status === 'LOCKED' ? 'on temporary hold' : 'already booked'}. Please select another available seat.`
      );
      return;
    }

    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      } else {
        return [...prev, seatNumber].sort((a, b) => a - b);
      }
    });
  };

  const pricePerSeat = Number(trip?.price || 1200);
  const totalPrice = pricePerSeat * selectedSeats.length;

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Select Seats', 'Please tap on at least one available seat from the bus layout to proceed.');
      return;
    }

    // Safety validation: verify none of the selected seats are booked
    const invalidSeat = selectedSeats.find((num) => {
      const s = seats.find((seat) => seat.seatNumber === num);
      return s && (s.isBooked || s.status !== 'AVAILABLE');
    });
    if (invalidSeat) {
      Alert.alert(
        'Seat Unavailable',
        `Seat #${invalidSeat} is already booked or reserved. Please unselect it and choose an open green seat.`
      );
      return;
    }

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    if (!cleanFirst || !cleanLast) {
      Alert.alert('Passenger Name Required', 'Please enter your First Name and Last Name.');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      Alert.alert('Phone Required', 'Please enter a contact phone number for SMS ticket delivery and payment verification.');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      Alert.alert('Email Required', 'Please enter an email address for e-ticket delivery.');
      return;
    }

    const fullName = `${cleanFirst} ${cleanLast}`;

    router.push({
      pathname: '/passenger/payment',
      params: {
        tripId: trip?.id,
        seatNumbers: JSON.stringify(selectedSeats),
        seatsDisplay: selectedSeats.map((s) => `#${s}`).join(', '),
        price: String(pricePerSeat),
        totalPrice: String(totalPrice),
        passengerName: fullName,
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        pickupLocation: pickupLocation.trim() || `${trip?.origin} Station`,
        dropoffLocation: dropoffLocation.trim() || `${trip?.destination} Station`,
        origin: trip?.origin,
        destination: trip?.destination,
        departureTime: trip?.departureTime,
        departureDate: trip?.departureDate,
        operatorName: trip?.operatorName,
        busPlate: trip?.busPlate,
      },
    });
  };

  if (loading || !trip) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={ROSE} />
        <Text style={styles.loadingText}>Loading seat layout & vehicle map...</Text>
      </SafeAreaView>
    );
  }

  // 4 seats per row (2 left, aisle, 2 right)
  const rows: SeatInfo[][] = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Header ────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {trip.origin} → {trip.destination}
          </Text>
          <Text style={styles.headerSub}>
            {trip.operatorName} • {trip.departureTime}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Trip Summary Card ───────────────────────────── */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryRoute}>
                  {trip.origin} to {trip.destination}
                </Text>
                <Text style={styles.summaryMeta}>
                  📅 {trip.departureDate} at {trip.departureTime}
                </Text>
                <Text style={styles.summaryPlate}>
                  🚌 {trip.busPlate} • {trip.busType}
                </Text>
              </View>
              <View style={styles.fareTag}>
                <Text style={styles.fareAmount}>{trip.price} ETB</Text>
                <Text style={styles.fareLabel}>per seat</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Multi-Seat Selection Status Bar ─────────────── */}
          <View style={styles.seatStatusBar}>
            <View style={styles.seatStatusLeft}>
              <Text style={styles.seatStatusLabel}>
                Selected Seats ({selectedSeats.length}):
              </Text>
              <Text style={styles.seatStatusChips}>
                {selectedSeats.length > 0
                  ? selectedSeats.map((s) => `#${s}`).join(', ')
                  : 'None selected'}
              </Text>
            </View>
            {selectedSeats.length > 0 && (
              <TouchableOpacity
                onPress={() => setSelectedSeats([])}
                style={styles.clearSeatsBtn}
              >
                <Text style={styles.clearSeatsText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Available Seats Quick Selection Bar ───────────── */}
          <View style={styles.quickAvailableBox}>
            <View style={styles.quickAvailableHeader}>
              <Text style={styles.quickAvailableTitle}>
                🟢 Available Seats ({availableSeats.length} of {seats.length} open):
              </Text>
              <TouchableOpacity
                onPress={() => setOnlyAvailableFilter((p) => !p)}
                style={styles.toggleFilterBtn}
              >
                <Text style={styles.toggleFilterText}>
                  {onlyAvailableFilter ? 'Show All Layout' : 'Filter Available'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickSeatChipsScroll}
            >
              {availableSeats.map((s) => {
                const isSelected = selectedSeats.includes(s.seatNumber);
                return (
                  <TouchableOpacity
                    key={'quick-s-' + s.seatNumber}
                    style={[
                      styles.quickSeatChip,
                      isSelected && styles.quickSeatChipSelected,
                    ]}
                    onPress={() => toggleSeat(s.seatNumber, false, 'AVAILABLE')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickSeatChipText,
                        isSelected && styles.quickSeatChipTextSelected,
                      ]}
                    >
                      #{s.seatNumber} {isSelected ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Seat Map Legend ─────────────────────────────── */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendAvailable]} />
              <Text style={styles.legendText}>Available ({availableSeats.length})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendOccupied]} />
              <Text style={styles.legendText}>Booked / Held</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendSelected]} />
              <Text style={styles.legendText}>Selected ({selectedSeats.length})</Text>
            </View>
          </View>

          {/* ── Interactive Bus Interior Map ────────────────── */}
          <View style={styles.busContainer}>
            {/* Front of Bus (Driver Area) */}
            <View style={styles.busFrontArea}>
              <Text style={styles.frontLabel}>FRONT OF BUS (DRIVER CABIN)</Text>
              <View style={styles.steeringRow}>
                <View style={styles.doorArea}>
                  <Text style={styles.doorText}>🚪 ENTRANCE</Text>
                </View>
                <View style={styles.steeringWheel}>
                  <Text style={styles.steeringIcon}>🛞 DRIVER</Text>
                </View>
              </View>
            </View>

            {/* Aisle & Seats Grid */}
            <View style={styles.seatRowsWrapper}>
              {rows.map((row, rowIdx) => {
                const leftPair = row.slice(0, 2);
                const rightPair = row.slice(2, 4);

                return (
                  <View key={'row-' + rowIdx} style={styles.busRow}>
                    {/* Left 2 Seats */}
                    <View style={styles.seatPair}>
                      {leftPair.map((seat) => {
                        const isSelected = selectedSeats.includes(seat.seatNumber);
                        const isUnavailable = seat.isBooked || seat.status !== 'AVAILABLE';
                        
                        if (onlyAvailableFilter && isUnavailable) {
                          return (
                            <View key={'seat-' + seat.seatNumber} style={[styles.seatUnit, styles.seatUnitHidden]}>
                              <Text style={styles.seatHiddenText}>-</Text>
                            </View>
                          );
                        }

                        return (
                          <TouchableOpacity
                            key={'seat-' + seat.seatNumber}
                            style={[
                              styles.seatUnit,
                              isUnavailable && styles.seatOccupied,
                              isSelected && styles.seatSelected,
                            ]}
                            onPress={() => toggleSeat(seat.seatNumber, seat.isBooked, seat.status)}
                            disabled={isUnavailable}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.seatNumberText,
                                isUnavailable && styles.seatOccupiedText,
                                isSelected && styles.seatSelectedText,
                              ]}
                            >
                              {isUnavailable ? '✕' : seat.seatNumber}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Walking Aisle */}
                    <View style={styles.aisle}>
                      <Text style={styles.aisleText}>{rowIdx + 1}</Text>
                    </View>

                    {/* Right 2 Seats */}
                    <View style={styles.seatPair}>
                      {rightPair.map((seat) => {
                        const isSelected = selectedSeats.includes(seat.seatNumber);
                        const isUnavailable = seat.isBooked || seat.status !== 'AVAILABLE';

                        if (onlyAvailableFilter && isUnavailable) {
                          return (
                            <View key={'seat-' + seat.seatNumber} style={[styles.seatUnit, styles.seatUnitHidden]}>
                              <Text style={styles.seatHiddenText}>-</Text>
                            </View>
                          );
                        }

                        return (
                          <TouchableOpacity
                            key={'seat-' + seat.seatNumber}
                            style={[
                              styles.seatUnit,
                              isUnavailable && styles.seatOccupied,
                              isSelected && styles.seatSelected,
                            ]}
                            onPress={() => toggleSeat(seat.seatNumber, seat.isBooked, seat.status)}
                            disabled={isUnavailable}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.seatNumberText,
                                isUnavailable && styles.seatOccupiedText,
                                isSelected && styles.seatSelectedText,
                              ]}
                            >
                              {isUnavailable ? '✕' : seat.seatNumber}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Passenger & Travel Details (Best Modern UI/UX) ────────── */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.passengerFormCard}>
            <View style={styles.formCardHeader}>
              <View style={styles.formCardHeaderIcon}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
              <View>
                <Text style={styles.formSectionTitle}>Passenger Information</Text>
                <Text style={styles.formSectionSub}>
                  Official details for boarding pass verification
                </Text>
              </View>
            </View>

            {/* Name Fields (First & Last) */}
            <View style={styles.nameRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>FIRST NAME *</Text>
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="e.g. Abebe"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>LAST NAME *</Text>
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="e.g. Bikila"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Contact Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS (FOR E-TICKETS) *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="passenger@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER (TELEBIRR / SMS) *</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="0911 22 33 44"
                keyboardType="phone-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Stations */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BOARDING / PICKUP POINT</Text>
              <TextInput
                style={styles.textInput}
                value={pickupLocation}
                onChangeText={setPickupLocation}
                placeholder="e.g. Addis Ababa Meskel Square"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DESTINATION DROPOFF POINT</Text>
              <TextInput
                style={styles.textInput}
                value={dropoffLocation}
                onChangeText={setDropoffLocation}
                placeholder="e.g. Bahir Dar Bus Station"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Selection Summary Pill */}
            <View style={styles.selectionSummaryPill}>
              <Text style={styles.summarySeatsText}>
                Seats: {selectedSeats.length > 0 ? selectedSeats.map((s) => `#${s}`).join(', ') : 'None'}
              </Text>
              <Text style={styles.summaryFareText}>
                Total: {totalPrice.toLocaleString()} ETB
              </Text>
            </View>

            {/* Scrollable Proceed to Payment Button */}
            <View style={styles.scrollProceedContainer}>
              <TouchableOpacity
                style={[
                  styles.scrollProceedBtn,
                  selectedSeats.length === 0 && styles.proceedBtnDisabled,
                ]}
                onPress={handleProceedToPayment}
                disabled={selectedSeats.length === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.scrollProceedBtnText}>
                  {selectedSeats.length === 0
                    ? 'Select a Seat to Continue'
                    : `Proceed to Payment (${totalPrice.toLocaleString()} ETB) →`}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Fixed Bottom Checkout Bar ──────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomSeatsText}>
            {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
          </Text>
          <Text style={styles.bottomPriceText}>{totalPrice.toLocaleString()} ETB</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.proceedBtn,
            selectedSeats.length === 0 && styles.proceedBtnDisabled,
          ]}
          onPress={handleProceedToPayment}
          disabled={selectedSeats.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.proceedBtnText}>Proceed to Payment →</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: SLATE_600,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: SLATE_100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SLATE_800,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: SLATE_900,
  },
  headerSub: {
    fontSize: 12,
    color: SLATE_600,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },

  // Trip Summary Card
  summaryCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRoute: {
    fontSize: 15,
    fontWeight: '900',
    color: SLATE_900,
  },
  summaryMeta: {
    fontSize: 12,
    color: SLATE_600,
    fontWeight: '600',
    marginTop: 3,
  },
  summaryPlate: {
    fontSize: 11,
    color: SLATE_400,
    marginTop: 2,
  },
  fareTag: {
    alignItems: 'flex-end',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  fareAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: ROSE,
  },
  fareLabel: {
    fontSize: 9,
    color: SLATE_600,
    fontWeight: '600',
  },

  // Seat Status Bar
  seatStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  seatStatusLeft: {
    flex: 1,
  },
  seatStatusLabel: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '700',
  },
  seatStatusChips: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '900',
    marginTop: 1,
  },
  clearSeatsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
  },
  clearSeatsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af',
  },

  // Quick Available Box
  quickAvailableBox: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  quickAvailableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickAvailableTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN,
  },
  toggleFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: SLATE_100,
  },
  toggleFilterText: {
    fontSize: 10,
    fontWeight: '700',
    color: SLATE_700,
  },
  quickSeatChipsScroll: {
    gap: 6,
  },
  quickSeatChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  quickSeatChipSelected: {
    backgroundColor: ROSE,
    borderColor: ROSE_DARK,
  },
  quickSeatChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN,
  },
  quickSeatChipTextSelected: {
    color: WHITE,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendAvailable: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  legendOccupied: {
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  legendSelected: {
    backgroundColor: ROSE,
  },
  legendText: {
    fontSize: 10,
    color: SLATE_600,
    fontWeight: '700',
  },

  // Bus interior
  busContainer: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  busFrontArea: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  frontLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: SLATE_400,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  steeringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  doorArea: {
    backgroundColor: SLATE_100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doorText: {
    fontSize: 9,
    color: SLATE_600,
    fontWeight: '700',
  },
  steeringWheel: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  steeringIcon: {
    fontSize: 9,
    color: '#2563eb',
    fontWeight: '700',
  },
  seatRowsWrapper: {
    gap: 8,
  },
  busRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatPair: {
    flexDirection: 'row',
    gap: 6,
  },
  seatUnit: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatUnitHidden: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  seatHiddenText: {
    color: 'transparent',
  },
  seatOccupied: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  seatSelected: {
    backgroundColor: ROSE,
    borderColor: ROSE_DARK,
    shadowColor: ROSE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  seatNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN,
  },
  seatOccupiedText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  seatSelectedText: {
    color: WHITE,
    fontWeight: '900',
  },
  aisle: {
    width: 22,
    alignItems: 'center',
  },
  aisleText: {
    fontSize: 9,
    color: '#cbd5e1',
    fontWeight: '700',
  },

  // Passenger Form
  passengerFormCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  formCardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: SLATE_900,
  },
  formSectionSub: {
    fontSize: 11,
    color: SLATE_600,
    marginTop: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    marginBottom: 11,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: SLATE_700,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: SLATE_900,
    fontWeight: '600',
  },
  selectionSummaryPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 6,
  },
  summarySeatsText: {
    fontSize: 12,
    fontWeight: '800',
    color: SLATE_900,
  },
  summaryFareText: {
    fontSize: 12,
    fontWeight: '900',
    color: GREEN,
  },

  // Bottom Checkout Bar
  scrollProceedContainer: {
    marginTop: 16,
  },
  scrollProceedBtn: {
    backgroundColor: ROSE,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ROSE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  scrollProceedBtnText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
  },
  bottomBar: {
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomSeatsText: {
    fontSize: 11,
    color: SLATE_600,
    fontWeight: '600',
  },
  bottomPriceText: {
    fontSize: 18,
    fontWeight: '900',
    color: SLATE_900,
  },
  proceedBtn: {
    backgroundColor: ROSE,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: ROSE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  proceedBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
  },
  proceedBtnText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '800',
  },
});
