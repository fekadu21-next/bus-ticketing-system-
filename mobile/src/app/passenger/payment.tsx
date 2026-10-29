import React, { useState } from 'react';
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

type PaymentMethod = 'TELEBIRR' | 'CHAPA' | 'CBE_BIRR' | 'STATION_PAY';

export default function PassengerPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tripId: string;
    seatNumber: string;
    price: string;
    passengerName: string;
    phoneNumber: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    departureDate?: string;
    operatorName?: string;
    busPlate?: string;
  }>();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TELEBIRR');
  const [telebirrPhone, setTelebirrPhone] = useState(params.phoneNumber || '0911223344');
  const [isProcessing, setIsProcessing] = useState(false);

  const amount = Number(params.price || 1200);
  const seatNum = Number(params.seatNumber || 1);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    try {
      // 1. Create booking in backend
      const bookingRes = await apiService.createPassengerBooking({
        tripId: params.tripId,
        seatNumber: seatNum,
        passengerName: params.passengerName,
        phone: params.phoneNumber,
      });

      if (!bookingRes.success || !bookingRes.data?.booking) {
        Alert.alert('Booking Error', bookingRes.error || 'Could not create booking. Please try again.');
        setIsProcessing(false);
        return;
      }

      const booking = bookingRes.data.booking;

      // 2. Initialize payment with selected provider
      await apiService.initializePassengerPayment({
        bookingId: booking.id,
        amount,
        paymentMethod,
        phoneNumber: telebirrPhone,
      });

      // 3. Success! Route to the generated ticket
      Alert.alert(
        '🎉 Payment Successful!',
        `Your seat #${seatNum} has been confirmed. Your digital ticket and QR boarding pass have been issued.`,
        [
          {
            text: 'View My Ticket',
            onPress: () => {
              router.replace({
                pathname: '/passenger/ticket/[id]',
                params: {
                  id: booking.ticket?.id || booking.id,
                  bookingData: JSON.stringify(booking),
                },
              });
            },
          },
        ]
      );
    } catch {
      Alert.alert('Payment Error', 'Transaction could not be completed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm & Pay</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Order Summary Card */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.summaryCard}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeText}>
                {params.origin || 'Addis Ababa'} → {params.destination || 'Bahir Dar'}
              </Text>
              <Text style={styles.dateBadge}>{params.departureDate || 'Today'}</Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>OPERATOR</Text>
                <Text style={styles.summaryVal}>{params.operatorName || 'Selam Bus Line'}</Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>DEPARTURE TIME</Text>
                <Text style={styles.summaryVal}>{params.departureTime || '06:00 AM'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>PASSENGER</Text>
                <Text style={styles.summaryVal}>{params.passengerName}</Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>ASSIGNED SEAT</Text>
                <Text style={[styles.summaryVal, { color: '#0f766e', fontWeight: '900' }]}>
                  Seat #{seatNum}
                </Text>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT DUE</Text>
              <Text style={styles.totalAmount}>{amount} ETB</Text>
            </View>
          </Animated.View>

          {/* Payment Method Selector */}
          <Text style={styles.sectionHeader}>Select Ethiopian Payment Method</Text>

          {/* Telebirr Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'TELEBIRR' && styles.activePaymentOption,
            ]}
            onPress={() => setPaymentMethod('TELEBIRR')}
            activeOpacity={0.8}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Text style={styles.optionIcon}>📱</Text>
              </View>
              <View>
                <Text style={styles.optionTitle}>Telebirr (Ethio Telecom)</Text>
                <Text style={styles.optionSub}>Instant USSD push prompt on mobile</Text>
              </View>
            </View>
            <View style={[styles.radioCircle, paymentMethod === 'TELEBIRR' && styles.radioActive]} />
          </TouchableOpacity>

          {paymentMethod === 'TELEBIRR' && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.telebirrInputWrap}>
              <Text style={styles.inputHelp}>Telebirr Registered Phone Number:</Text>
              <TextInput
                style={styles.telebirrInput}
                value={telebirrPhone}
                onChangeText={setTelebirrPhone}
                placeholder="0911223344"
                keyboardType="phone-pad"
              />
            </Animated.View>
          )}

          {/* Chapa Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'CHAPA' && styles.activePaymentOption,
            ]}
            onPress={() => setPaymentMethod('CHAPA')}
            activeOpacity={0.8}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.optionIcon}>💳</Text>
              </View>
              <View>
                <Text style={styles.optionTitle}>Chapa Payment Gateway</Text>
                <Text style={styles.optionSub}>Debit Card, Awash, Dashen, Coopec</Text>
              </View>
            </View>
            <View style={[styles.radioCircle, paymentMethod === 'CHAPA' && styles.radioActive]} />
          </TouchableOpacity>

          {/* CBE Birr Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'CBE_BIRR' && styles.activePaymentOption,
            ]}
            onPress={() => setPaymentMethod('CBE_BIRR')}
            activeOpacity={0.8}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#f3e8ff' }]}>
                <Text style={styles.optionIcon}>🏦</Text>
              </View>
              <View>
                <Text style={styles.optionTitle}>CBE Birr</Text>
                <Text style={styles.optionSub}>Commercial Bank of Ethiopia Mobile</Text>
              </View>
            </View>
            <View style={[styles.radioCircle, paymentMethod === 'CBE_BIRR' && styles.radioActive]} />
          </TouchableOpacity>

          {/* Station Pay Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'STATION_PAY' && styles.activePaymentOption,
            ]}
            onPress={() => setPaymentMethod('STATION_PAY')}
            activeOpacity={0.8}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#ecfdf5' }]}>
                <Text style={styles.optionIcon}>💵</Text>
              </View>
              <View>
                <Text style={styles.optionTitle}>Pay at Station Gate</Text>
                <Text style={styles.optionSub}>Reserve seat now, pay cash at terminal</Text>
              </View>
            </View>
            <View style={[styles.radioCircle, paymentMethod === 'STATION_PAY' && styles.radioActive]} />
          </TouchableOpacity>

          {/* Security Guarantee */}
          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              256-bit encrypted Ethiopian national transport ticketing transaction. Verified digital QR boarding token issued instantly upon confirmation.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Pay CTA Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handleConfirmPayment}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.payButtonText}>
              CONFIRM & PAY {amount} ETB
            </Text>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  backIcon: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f766e',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  activePaymentOption: {
    borderColor: '#0f766e',
    backgroundColor: '#f0fdfa',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 20,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  optionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  radioActive: {
    borderColor: '#0f766e',
    backgroundColor: '#0f766e',
  },
  telebirrInputWrap: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
    marginTop: -4,
  },
  inputHelp: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 6,
  },
  telebirrInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  payButton: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
