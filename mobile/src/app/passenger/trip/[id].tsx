import React, { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { apiService } from '@/services/api';
import type { PassengerTrip, SeatInfo } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function TripSeatSelectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [trip, setTrip] = useState<PassengerTrip | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Passenger form
  const [passengerName, setPassengerName] = useState(
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || ''
  );
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');

  useEffect(() => {
    if (user) {
      const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      if (full && !passengerName) {
        setPassengerName(full);
      }
      if (user.phone && !phoneNumber) {
        setPhoneNumber(user.phone);
      }
    }
  }, [user, passengerName, phoneNumber]);

  useEffect(() => {
    async function loadTripAndSeats() {
      if (!id) return;
      try {
        const res = await apiService.getPassengerTripDetails(id);
        if (res.success && res.data) {
          setTrip(res.data.trip);
          setSeats(res.data.seats);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadTripAndSeats();
  }, [id]);

  const handleSeatPress = (seatNumber: number, isBooked: boolean) => {
    if (isBooked) {
      Alert.alert('Seat Unavailable', 'Seat ' + seatNumber + ' is already booked by another passenger.');
      return;
    }
    if (selectedSeat === seatNumber) {
      setSelectedSeat(null);
    } else {
      setSelectedSeat(seatNumber);
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedSeat) {
      Alert.alert('Seat Required', 'Please tap on an available seat from the bus map to select it.');
      return;
    }

    if (!passengerName.trim()) {
      Alert.alert('Passenger Name Required', 'Please enter the passenger full name for the ticket.');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter a contact phone number for SMS ticket delivery.');
      return;
    }

    router.push({
      pathname: '/passenger/payment',
      params: {
        tripId: trip?.id,
        seatNumber: selectedSeat,
        price: trip?.price || 1200,
        passengerName: passengerName.trim(),
        phoneNumber: phoneNumber.trim(),
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
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Loading seat layout...</Text>
      </SafeAreaView>
    );
  }

  // Group seats in rows of 4 (2 left, aisle, 2 right)
  const rows: SeatInfo[][] = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{trip.origin} → {trip.destination}</Text>
          <Text style={styles.headerSub}>
            {trip.operatorName} • {trip.departureTime}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Trip Summary Card */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryRoute}>{trip.origin} to {trip.destination}</Text>
                <Text style={styles.summaryMeta}>Departure: {trip.departureTime} ({trip.departureDate})</Text>
                <Text style={styles.summaryPlate}>Bus: {trip.busPlate} • {trip.busType}</Text>
              </View>
              <View style={styles.fareTag}>
                <Text style={styles.fareAmount}>{trip.price} ETB</Text>
                <Text style={styles.fareLabel}>Ticket Fare</Text>
              </View>
            </View>
          </Animated.View>

          {/* Seat Map Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendAvailable]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendOccupied]} />
              <Text style={styles.legendText}>Occupied</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendSelected]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
          </View>

          {/* Interactive Bus Interior Map */}
          <View style={styles.busContainer}>
            {/* Front of Bus (Steering Wheel & Driver Area) */}
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
                        const isSelected = selectedSeat === seat.seatNumber;
                        return (
                          <TouchableOpacity
                            key={'seat-' + seat.seatNumber}
                            style={[
                              styles.seatUnit,
                              seat.isBooked && styles.seatOccupied,
                              isSelected && styles.seatSelected,
                            ]}
                            onPress={() => handleSeatPress(seat.seatNumber, seat.isBooked)}
                            disabled={seat.isBooked}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.seatNumberText,
                                seat.isBooked && styles.seatOccupiedText,
                                isSelected && styles.seatSelectedText,
                              ]}
                            >
                              {seat.seatNumber}
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
                        const isSelected = selectedSeat === seat.seatNumber;
                        return (
                          <TouchableOpacity
                            key={'seat-' + seat.seatNumber}
                            style={[
                              styles.seatUnit,
                              seat.isBooked && styles.seatOccupied,
                              isSelected && styles.seatSelected,
                            ]}
                            onPress={() => handleSeatPress(seat.seatNumber, seat.isBooked)}
                            disabled={seat.isBooked}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.seatNumberText,
                                seat.isBooked && styles.seatOccupiedText,
                                isSelected && styles.seatSelectedText,
                              ]}
                            >
                              {seat.seatNumber}
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

          {/* Passenger Information Form */}
          <View style={styles.passengerFormCard}>
            <Text style={styles.formSectionTitle}>Passenger Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL PASSENGER NAME</Text>
              <TextInput
                style={styles.textInput}
                value={passengerName}
                onChangeText={setPassengerName}
                placeholder="e.g. Abebe Bikila"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONTACT PHONE NUMBER (ET)</Text>
              <TextInput
                style={styles.textInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+251 91 123 4567"
                keyboardType="phone-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Checkout Action */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomSeatLabel}>
            {selectedSeat ? 'Selected Seat #' + selectedSeat : 'No Seat Selected'}
          </Text>
          <Text style={styles.bottomPriceAmount}>
            {selectedSeat ? trip.price + ' ETB' : '0 ETB'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, !selectedSeat && styles.checkoutBtnDisabled]}
          onPress={handleProceedToPayment}
          disabled={!selectedSeat}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutBtnText}>PROCEED TO PAY →</Text>
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
    color: '#64748b',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '800',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRoute: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryMeta: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  summaryPlate: {
    fontSize: 11,
    color: '#0f766e',
    fontWeight: '700',
    marginTop: 4,
  },
  fareTag: {
    alignItems: 'flex-end',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f766e',
  },
  fareLabel: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 18,
    height: 18,
    borderRadius: 6,
  },
  legendAvailable: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  legendOccupied: {
    backgroundColor: '#cbd5e1',
  },
  legendSelected: {
    backgroundColor: '#0f766e',
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  busContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  busFrontArea: {
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 16,
  },
  frontLabel: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  steeringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  doorArea: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  doorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  steeringWheel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  steeringIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
  },
  seatRowsWrapper: {
    gap: 10,
  },
  busRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatPair: {
    flexDirection: 'row',
    gap: 8,
  },
  seatUnit: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatOccupied: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
    opacity: 0.6,
  },
  seatSelected: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  seatNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  seatOccupiedText: {
    color: '#94a3b8',
  },
  seatSelectedText: {
    color: '#ffffff',
  },
  aisle: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aisleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  passengerFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPriceInfo: {
    flex: 1,
  },
  bottomSeatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  bottomPriceAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f766e',
    marginTop: 2,
  },
  checkoutBtn: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
