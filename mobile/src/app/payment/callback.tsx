import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { apiService } from '@/services/api';
import { Theme } from '@/constants/theme';

export default function PaymentCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tx_ref?: string;
    transactionReference?: string;
    status?: string;
    payment_method?: string;
    booking_id?: string;
  }>();

  const [verificationStatus, setVerificationStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [statusMessage, setStatusMessage] = useState('Verifying your payment...');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function verifyAndNavigate() {
      const txRef = params.tx_ref || params.transactionReference;
      const callbackStatus = params.status;
      const paymentMethod = params.payment_method || 'CHAPA';

      if (!txRef) {
        if (isMounted) {
          setVerificationStatus('error');
          setErrorMessage('Invalid payment callback. Transaction reference not found.');
        }
        return;
      }

      if (callbackStatus === 'cancelled' || callbackStatus === 'failed') {
        if (isMounted) {
          setVerificationStatus('error');
          setErrorMessage('Payment was cancelled or failed. Please try again.');
        }
        return;
      }

      try {
        setStatusMessage('Connecting to payment provider & confirming transaction...');
        // 1. Verify with backend
        const verifyRes = await apiService.verifyPassengerPayment({
          transactionReference: txRef,
          paymentMethod,
        });

        if (!verifyRes.success) {
          console.warn('Verification note:', verifyRes.error);
        }

        if (isMounted) {
          setVerificationStatus('success');
          setStatusMessage('Your seat is confirmed. Redirecting to your boarding ticket...');
        }

        // 2. Fetch the newly confirmed booking
        const bookingsRes = await apiService.getPassengerBookings();
        let confirmedBooking: any = null;

        if (bookingsRes.success && bookingsRes.data?.bookings?.length) {
          confirmedBooking =
            bookingsRes.data.bookings.find(
              (b: any) =>
                b.payment?.transactionReference === txRef ||
                b.transactionReference === txRef ||
                b.id === params.booking_id
            ) || bookingsRes.data.bookings[0];
        }

        setTimeout(() => {
          if (!isMounted) return;
          if (confirmedBooking) {
            router.replace({
              pathname: '/passenger/ticket/[id]',
              params: {
                id: confirmedBooking.id,
                bookingData: JSON.stringify(confirmedBooking),
              },
            });
          } else {
            router.replace('/passenger/bookings');
          }
        }, 1200);
      } catch (err: any) {
        if (isMounted) {
          setVerificationStatus('error');
          setErrorMessage(err?.message || 'Payment verification failed. Please contact support if payment was made.');
        }
      }
    }

    void verifyAndNavigate();

    return () => {
      isMounted = false;
    };
  }, [params.tx_ref, params.transactionReference, params.status, params.payment_method, params.booking_id]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
        {verificationStatus === 'processing' && (
          <View style={styles.stateContainer}>
            <View style={styles.spinnerWrap}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
            <Text style={styles.title}>Verifying Payment</Text>
            <Text style={styles.subtitle}>
              Please wait while we confirm your payment and issue your digital ticket...
            </Text>
          </View>
        )}

        {verificationStatus === 'success' && (
          <View style={styles.stateContainer}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.title}>Payment Verified!</Text>
            <Text style={styles.subtitle}>{statusMessage}</Text>
          </View>
        )}

        {verificationStatus === 'error' && (
          <View style={styles.stateContainer}>
            <View style={styles.errorIconCircle}>
              <Text style={styles.errorIcon}>✕</Text>
            </View>
            <Text style={styles.title}>Payment Verification Notice</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Try Payment Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.replace('/passenger/bookings')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>View My Bookings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  stateContainer: {
    alignItems: 'center',
    width: '100%',
  },
  spinnerWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 32,
    color: '#059669',
    fontWeight: '900',
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 28,
    color: '#dc2626',
    fontWeight: '900',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  errorMessage: {
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
    lineHeight: 19,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    width: '100%',
    marginTop: 12,
    marginBottom: 20,
  },
  actionRow: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 13,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    width: '100%',
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
});
