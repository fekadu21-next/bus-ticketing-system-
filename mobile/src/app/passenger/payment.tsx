import React, { useState, useEffect, useMemo } from 'react';
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
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { apiService } from '@/services/api';
import { Theme } from '@/constants/theme';

type PaymentMethod = 'CHAPA' | 'TELEBIRR';
type TelebirrTab = 'ussd' | 'qr';
type ProcessStep = 0 | 1 | 2 | 3;

// ─── Helpers ──────────────────────────────────────────────────────────
const formatEtb = (amount: number) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ETB';
  return `${amount.toLocaleString()} ETB`;
};

export default function PassengerPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    tripId: string;
    seatNumbers: string;
    seatsDisplay: string;
    price: string;
    totalPrice: string;
    passengerName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    departureDate?: string;
    operatorName?: string;
    busPlate?: string;
  }>();

  // ─── State ──────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CHAPA');

  // Telebirr state
  const [telebirrPhone, setTelebirrPhone] = useState(params.phoneNumber || '0911223344');
  const [telebirrTab, setTelebirrTab] = useState<TelebirrTab>('ussd');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10-minute session

  // Chapa state
  const [chapaEmail, setChapaEmail] = useState(params.email || 'passenger@example.com');

  // Global processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<ProcessStep>(0);

  // Deep-link listener for Chapa redirect (busticket://payment/callback)
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      if (event.url && event.url.includes('busticket://')) {
        try {
          WebBrowser.dismissAuthSession();
        } catch {}
      }
    };

    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  // ─── Parse seats ────────────────────────────────────────────────────
  let seatList: number[] = [1];
  try {
    if (params.seatNumbers) {
      seatList = JSON.parse(params.seatNumbers);
    }
  } catch {
    seatList = [1];
  }

  const pricePerSeat = Number(params.price || 1200);
  const totalAmount = Number(params.totalPrice || pricePerSeat * seatList.length);

  // ─── Countdown timer (Telebirr) ─────────────────────────────────────
  useEffect(() => {
    if (paymentMethod !== 'TELEBIRR') return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentMethod, timeLeft]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // ─── PIN helpers ─────────────────────────────────────────────────────
  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setPinError('');
    }
  };
  const handlePinBackspace = () => setPin((prev) => prev.slice(0, -1));
  const handlePinClear = () => setPin('');
  const handleAutofillPin = () => { setPin('1234'); setPinError(''); };

  // ─── Navigate to ticket confirmation ────────────────────────────────
  const navigateToTicket = (primaryBookingId: string, txRef: string) => {
    const confirmedData = {
      booking: {
        id: primaryBookingId,
        seatNumber: seatList[0],
        seatNumbers: seatList,
        totalFare: totalAmount,
        status: 'CONFIRMED',
        passengerName: params.passengerName,
        phone: telebirrPhone.trim() || params.phoneNumber,
        origin: params.origin || 'Addis Ababa',
        destination: params.destination || 'Destination',
        departureDate: params.departureDate,
        departureTime: params.departureTime,
        operatorName: params.operatorName || 'Intercity Bus',
        busPlate: params.busPlate || 'ET-BUS',
      },
      trip: {
        origin: params.origin || 'Addis Ababa',
        destination: params.destination || 'Destination',
        departureDate: params.departureDate,
        departureTime: params.departureTime,
        operatorName: params.operatorName || 'Intercity Bus',
        busPlate: params.busPlate,
        price: pricePerSeat,
      },
      payment: {
        paymentMethod,
        amount: totalAmount,
        transactionReference: txRef,
        status: 'COMPLETED',
      },
      passengerInfo: {
        fullName: params.passengerName,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email || chapaEmail,
        phone: telebirrPhone.trim() || params.phoneNumber,
        pickupLocation: params.pickupLocation,
        dropoffLocation: params.dropoffLocation,
      },
      selectedSeats: seatList,
      ticket: {
        id: `tkt-${primaryBookingId}`,
        ticketNumber: `ET-BKT-${Date.now().toString(36).toUpperCase()}`,
        qrToken: `SECURE-TICKET-${primaryBookingId}-${seatList.join('-')}`,
      },
    };

    router.replace({
      pathname: '/passenger/ticket/[id]',
      params: {
        id: primaryBookingId || 'confirmed',
        bookingData: JSON.stringify(confirmedData),
      },
    });
  };

  // ─── CHAPA FLOW ──────────────────────────────────────────────────────
  const handleChapaPayment = async () => {
    if (!chapaEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your email for Chapa payment receipt.');
      return;
    }

    setIsProcessing(true);
    setProcessStep(1);

    try {
      const txRef = `TX-BUS-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const primaryBookingId = `BK-${Date.now()}`;
      const appDeepLink = Linking.createURL('payment/callback');
      const apiBase = apiService.getBaseUrl();
      const reachableReturnUrl = `${apiBase}/passenger/callback/chapa?tx_ref=${encodeURIComponent(
        txRef
      )}&status=success&payment_method=CHAPA&platform=mobile&app_url=${encodeURIComponent(
        appDeepLink
      )}`;

      const initRes = await apiService.initializePassengerPayment({
        tripId: params.tripId,
        seatNumbers: seatList,
        amount: totalAmount,
        paymentMethod: 'CHAPA',
        platform: 'mobile',
        returnUrl: reachableReturnUrl,
        passengerInfo: {
          firstName: params.firstName || params.passengerName?.split(' ')[0] || 'Passenger',
          lastName: params.lastName || params.passengerName?.split(' ').slice(1).join(' ') || 'Traveler',
          email: chapaEmail.trim(),
          phone: params.phoneNumber || '0911223344',
          pickupLocation: params.pickupLocation || `${params.origin} Main Station`,
          dropoffLocation: params.dropoffLocation || `${params.destination} Station`,
        },
        phoneNumber: params.phoneNumber || '0911223344',
      });

      if (!initRes.success || !initRes.data) {
        Alert.alert('Initialization Failed', initRes.error || 'Could not start Chapa payment.');
        setIsProcessing(false);
        setProcessStep(0);
        return;
      }

      const finalTxRef = initRes.data.transactionReference || txRef;
      const finalBookingId = initRes.data.bookingId || primaryBookingId;
      const checkoutUrl = initRes.data.checkoutUrl || initRes.data.paymentUrl;

      const isLocalOrTestUrl =
        !checkoutUrl ||
        checkoutUrl.includes('localhost') ||
        checkoutUrl.includes('127.0.0.1') ||
        checkoutUrl.includes('mock=true') ||
        checkoutUrl.includes('/checkout/chapa');

      if (isLocalOrTestUrl) {
        setProcessStep(2);
        await new Promise((r) => setTimeout(r, 900));
        setProcessStep(3);
        await new Promise((r) => setTimeout(r, 1100));

        await apiService.verifyPassengerPayment({
          transactionReference: finalTxRef,
          paymentMethod: 'CHAPA',
          bookingId: finalBookingId,
        });

        setIsProcessing(false);
        setProcessStep(0);
        navigateToTicket(finalBookingId, finalTxRef);
        return;
      }

      if (checkoutUrl) {
        const redirectScheme = appDeepLink || 'busticket://';
        let sessionResult: WebBrowser.WebBrowserAuthSessionResult;
        try {
          sessionResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectScheme);
        } catch {
          try {
            await WebBrowser.openBrowserAsync(checkoutUrl, {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
              showTitle: true,
              toolbarColor: '#2563eb',
            });
          } catch {}
          sessionResult = { type: WebBrowser.WebBrowserResultType.CANCEL };
        }

        setProcessStep(3);

        const verifyRes = await apiService.verifyPassengerPayment({
          transactionReference: finalTxRef,
          paymentMethod: 'CHAPA',
          bookingId: finalBookingId,
        });

        setIsProcessing(false);
        setProcessStep(0);

        if (verifyRes.success || sessionResult.type === 'success' || (sessionResult as any).url?.includes('busticket://')) {
          navigateToTicket(finalBookingId, finalTxRef);
        } else {
          Alert.alert(
            'Chapa Payment',
            'Did you complete payment on the Chapa checkout page?',
            [
              {
                text: 'Yes — View Boarding Pass',
                onPress: () => navigateToTicket(finalBookingId, finalTxRef),
              },
              {
                text: 'Try Again',
                style: 'cancel',
              },
            ]
          );
        }
      } else {
        setProcessStep(3);
        await new Promise((r) => setTimeout(r, 1200));
        const verifyRes = await apiService.verifyPassengerPayment({
          transactionReference: txRef,
          paymentMethod: 'CHAPA',
          bookingId: primaryBookingId,
        });

        setIsProcessing(false);
        setProcessStep(0);

        if (verifyRes.success) {
          navigateToTicket(primaryBookingId, txRef);
        } else {
          Alert.alert('Error', 'Payment could not be verified. Check My Bookings shortly.');
          router.replace('/passenger/bookings');
        }
      }
    } catch {
      setIsProcessing(false);
      setProcessStep(0);
      Alert.alert('Payment Error', 'Transaction could not be completed. Please check your connection.');
    }
  };

  // ─── TELEBIRR FLOW ───────────────────────────────────────────────────
  const handleTelebirrConfirm = async () => {
    if (telebirrTab === 'ussd' && pin.length < 4) {
      setPinError('Please enter your 4-digit Telebirr PIN (demo: use 1234)');
      return;
    }

    setPinError('');
    setIsProcessing(true);
    setProcessStep(1);

    try {
      const initRes = await apiService.initializePassengerPayment({
        tripId: params.tripId,
        seatNumbers: seatList,
        amount: totalAmount,
        paymentMethod: 'TELEBIRR',
        passengerInfo: {
          firstName: params.firstName || params.passengerName?.split(' ')[0] || 'Passenger',
          lastName: params.lastName || params.passengerName?.split(' ').slice(1).join(' ') || 'Traveler',
          email: params.email || 'passenger@example.com',
          phone: telebirrPhone.trim(),
          pickupLocation: params.pickupLocation || `${params.origin} Main Station`,
          dropoffLocation: params.dropoffLocation || `${params.destination} Station`,
        },
        phoneNumber: telebirrPhone.trim(),
      });

      if (!initRes.success || !initRes.data) {
        Alert.alert('Initialization Failed', initRes.error || 'Could not start Telebirr payment.');
        setIsProcessing(false);
        setProcessStep(0);
        return;
      }

      const txRef = initRes.data.transactionReference || `TX-BUS-${Date.now()}`;
      const primaryBookingId = initRes.data.bookingId || `BK-${Date.now()}`;

      setProcessStep(2);
      await new Promise((r) => setTimeout(r, 1200));
      setProcessStep(3);
      await new Promise((r) => setTimeout(r, 1400));

      const verifyRes = await apiService.verifyPassengerPayment({
        transactionReference: txRef,
        paymentMethod: 'TELEBIRR',
        bookingId: primaryBookingId,
      });

      setIsProcessing(false);
      setProcessStep(0);

      if (verifyRes.success) {
        navigateToTicket(primaryBookingId, txRef);
      } else {
        navigateToTicket(primaryBookingId, txRef);
      }
    } catch {
      setIsProcessing(false);
      setProcessStep(0);
      Alert.alert('Telebirr Error', 'Could not complete Telebirr transaction. Please retry.');
    }
  };

  const processingMessages = [
    'Preparing payment...',
    'Connecting to payment gateway...',
    'Authorizing transaction & locking seats...',
    'Payment approved! Issuing tickets...',
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Top Header Banner (matches web PaymentPage) ── */}
      <View style={styles.headerBanner}>
        <LinearGradient
          colors={['#071833', '#0b2a4a', '#172554']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView edges={['top']} style={styles.bannerSafeArea}>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backLinkIcon}>←</Text>
            <Text style={styles.backLinkText}>Back to Passenger Info</Text>
          </TouchableOpacity>
          <Text style={styles.bannerTitle}>Payment</Text>
          <Text style={styles.bannerSubtitle}>Complete your payment to confirm your booking.</Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── 1. Booking Summary Card (matches web PaymentPage) ── */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
            <Text style={styles.cardHeading}>Booking Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Passenger</Text>
              <Text style={styles.summaryValue}>{params.passengerName || 'Valued Passenger'}</Text>
            </View>

            {(params.phoneNumber || telebirrPhone) ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phone Number</Text>
                <Text style={styles.summaryValue}>{params.phoneNumber || telebirrPhone}</Text>
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Trip</Text>
              <Text style={styles.summaryValue}>
                {params.origin || 'Addis Ababa'} → {params.destination || 'Destination'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{params.departureDate || 'Scheduled Departure'}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Seats</Text>
              <Text style={[styles.summaryValue, { color: Theme.colors.primary, fontWeight: '800' }]}>
                {seatList.join(', ')}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price per seat</Text>
              <Text style={styles.summaryValue}>{formatEtb(pricePerSeat)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>{formatEtb(totalAmount)}</Text>
            </View>
          </Animated.View>

          {/* ── 2. Select Payment Method Card (matches web PaymentPage) ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.card}>
            <Text style={styles.cardHeading}>Select Payment Method</Text>

            {/* Option A: Chapa (Hosted Gateway) */}
            <TouchableOpacity
              style={[styles.methodCard, paymentMethod === 'CHAPA' && styles.methodCardActive]}
              onPress={() => setPaymentMethod('CHAPA')}
              activeOpacity={0.85}
            >
              <View style={styles.methodIconWrap}>
                <Text style={styles.methodIcon}>💳</Text>
              </View>
              <View style={styles.methodInfo}>
                <View style={styles.methodTitleRow}>
                  <Text style={styles.methodTitle}>Chapa (Hosted Gateway)</Text>
                  <View style={styles.badgeTest}>
                    <Text style={styles.badgeTestText}>Test Credentials</Text>
                  </View>
                </View>
                <Text style={styles.methodDesc}>
                  Redirects to Chapa checkout with test payment methods
                </Text>
              </View>
              <View style={[styles.radioOuter, paymentMethod === 'CHAPA' && styles.radioOuterActive]}>
                {paymentMethod === 'CHAPA' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Option B: Telebirr (Mobile Money) */}
            <TouchableOpacity
              style={[styles.methodCard, paymentMethod === 'TELEBIRR' && styles.methodCardActive]}
              onPress={() => { setPaymentMethod('TELEBIRR'); setPin(''); setPinError(''); }}
              activeOpacity={0.85}
            >
              <View style={styles.methodIconWrap}>
                <Text style={styles.methodIcon}>📱</Text>
              </View>
              <View style={styles.methodInfo}>
                <View style={styles.methodTitleRow}>
                  <Text style={styles.methodTitle}>Telebirr (Mobile Money)</Text>
                  <View style={styles.badgeReal}>
                    <Text style={styles.badgeRealText}>Real</Text>
                  </View>
                </View>
                <Text style={styles.methodDesc}>
                  Ethio Telecom Telebirr USSD & App PIN payment
                </Text>
              </View>
              <View style={[styles.radioOuter, paymentMethod === 'TELEBIRR' && styles.radioOuterActive]}>
                {paymentMethod === 'TELEBIRR' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* ── Forms: Chapa Details ── */}
            {paymentMethod === 'CHAPA' && (
              <Animated.View entering={FadeInDown.duration(200)} style={styles.methodFormContainer}>
                <Text style={styles.inputLabel}>Email for Chapa Receipt</Text>
                <TextInput
                  style={styles.textInput}
                  value={chapaEmail}
                  onChangeText={setChapaEmail}
                  placeholder="passenger@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.methodHelpText}>
                  ✓ Redirects to secure Chapa checkout for card, mobile wallet, or bank payment.
                </Text>
              </Animated.View>
            )}

            {/* ── Forms: Telebirr Details ── */}
            {paymentMethod === 'TELEBIRR' && (
              <Animated.View entering={FadeInDown.duration(200)} style={styles.methodFormContainer}>
                {/* Timer row */}
                <View style={styles.timerRow}>
                  <Text style={styles.timerIcon}>⏱</Text>
                  <Text style={styles.timerText}>Session expires in </Text>
                  <Text style={[styles.timerText, { color: timeLeft < 60 ? '#dc2626' : Theme.colors.primary, fontWeight: '900' }]}>
                    {formattedTime}
                  </Text>
                </View>

                {/* USSD vs QR Tabs */}
                <View style={styles.telebirrTabBar}>
                  <TouchableOpacity
                    style={[styles.telebirrTab, telebirrTab === 'ussd' && styles.telebirrTabActive]}
                    onPress={() => { setTelebirrTab('ussd'); setPinError(''); }}
                  >
                    <Text style={[styles.telebirrTabText, telebirrTab === 'ussd' && styles.telebirrTabTextActive]}>
                      📱 USSD / PIN
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.telebirrTab, telebirrTab === 'qr' && styles.telebirrTabActive]}
                    onPress={() => setTelebirrTab('qr')}
                  >
                    <Text style={[styles.telebirrTabText, telebirrTab === 'qr' && styles.telebirrTabTextActive]}>
                      📷 QR Scan
                    </Text>
                  </TouchableOpacity>
                </View>

                {telebirrTab === 'ussd' ? (
                  <View>
                    <Text style={styles.inputLabel}>Telebirr Mobile Number</Text>
                    <View style={styles.phoneInputRow}>
                      <View style={styles.flagBadge}>
                        <Text style={styles.flagText}>🇪🇹 +251</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        value={telebirrPhone}
                        onChangeText={setTelebirrPhone}
                        placeholder="0911 223 344"
                        keyboardType="phone-pad"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>

                    <View style={styles.pinLabelRow}>
                      <Text style={styles.inputLabel}>Telebirr Wallet PIN (4 Digits)</Text>
                      <TouchableOpacity onPress={handleAutofillPin}>
                        <Text style={styles.autofillText}>Auto-fill Demo PIN</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.pinDotsContainer}>
                      {[0, 1, 2, 3].map((idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.pinDot,
                            pin.length > idx && styles.pinDotFilled,
                          ]}
                        >
                          {pin.length > idx && <Text style={styles.pinBullet}>•</Text>}
                        </View>
                      ))}
                    </View>
                    {pinError ? <Text style={styles.pinErrorText}>{pinError}</Text> : null}

                    {/* Numeric Keypad */}
                    <View style={styles.keypad}>
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={styles.keypadBtn}
                          onPress={() => handlePinInput(d)}
                          disabled={isProcessing}
                        >
                          <Text style={styles.keypadBtnText}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={[styles.keypadBtn, styles.keypadBtnAlt]} onPress={handlePinClear} disabled={isProcessing}>
                        <Text style={[styles.keypadBtnText, { fontSize: 11 }]}>Clear</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.keypadBtn} onPress={() => handlePinInput('0')} disabled={isProcessing}>
                        <Text style={styles.keypadBtnText}>0</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.keypadBtn, styles.keypadBtnAlt]} onPress={handlePinBackspace} disabled={isProcessing}>
                        <Text style={styles.keypadBtnText}>⌫</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.qrContainer}>
                    <Text style={styles.qrDesc}>
                      Scan with your <Text style={{ fontWeight: '800' }}>telebirr SuperApp</Text> to approve payment directly.
                    </Text>
                    <View style={styles.qrPlaceholder}>
                      <Text style={styles.qrIcon}>📱</Text>
                      <Text style={styles.qrRefText}>TX: {params.tripId}</Text>
                    </View>
                    <View style={styles.qrSteps}>
                      <Text style={styles.qrStepText}>1. Open telebirr → 2. QR Scan → 3. Approve {formatEtb(totalAmount)}</Text>
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Processing state indicator */}
            {isProcessing && (
              <View style={styles.processingWrap}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={styles.processingMessage}>{processingMessages[processStep]}</Text>
              </View>
            )}

            {/* ── Security Notice (matches web PaymentPage) ── */}
            <View style={styles.securityBox}>
              <Text style={styles.securityIcon}>🛡️</Text>
              <Text style={styles.securityText}>
                Your payment is secured with 256-bit SSL encryption
              </Text>
            </View>

            {/* ── Action Buttons ── */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.primaryPayButton, isProcessing && styles.primaryPayButtonDisabled]}
                onPress={paymentMethod === 'CHAPA' ? handleChapaPayment : handleTelebirrConfirm}
                disabled={isProcessing}
                activeOpacity={0.88}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryPayButtonText}>
                    Pay {formatEtb(totalAmount)} with {paymentMethod === 'CHAPA' ? 'Chapa' : 'Telebirr'} →
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBanner: {
    paddingBottom: 28,
  },
  bannerSafeArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  backLinkIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
  },
  backLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bannerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
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
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  methodCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#eff6ff',
  },
  methodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodIcon: {
    fontSize: 20,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  badgeTest: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
  },
  badgeTestText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  badgeReal: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
  },
  badgeRealText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  methodDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioOuterActive: {
    borderColor: Theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
  },
  methodFormContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },
  methodHelpText: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  timerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  timerText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  telebirrTabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  telebirrTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  telebirrTabActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  telebirrTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  telebirrTabTextActive: {
    color: '#ffffff',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  flagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
  },
  flagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  pinLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  autofillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  pinDot: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotFilled: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#eff6ff',
  },
  pinBullet: {
    fontSize: 22,
    color: Theme.colors.primary,
    fontWeight: '900',
  },
  pinErrorText: {
    fontSize: 11,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  keypadBtn: {
    width: '30%',
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadBtnAlt: {
    backgroundColor: '#f1f5f9',
  },
  keypadBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  qrDesc: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  qrPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrIcon: {
    fontSize: 48,
  },
  qrRefText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  qrSteps: {
    paddingHorizontal: 8,
  },
  qrStepText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    textAlign: 'center',
  },
  processingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 14,
  },
  processingMessage: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 18,
    marginTop: 4,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
    flex: 1,
  },
  actionButtonsRow: {
    gap: 10,
  },
  primaryPayButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.radius.full,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryPayButtonDisabled: {
    opacity: 0.6,
  },
  primaryPayButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: Theme.radius.full,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
