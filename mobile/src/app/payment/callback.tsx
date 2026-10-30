import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '@/services/api';

const GREEN = '#059669';
const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const WHITE = '#ffffff';

export default function PaymentCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tx_ref?: string;
    transactionReference?: string;
    status?: string;
    payment_method?: string;
    booking_id?: string;
  }>();

  const [statusMessage, setStatusMessage] = useState('Verifying your payment...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyAndNavigate() {
      const txRef = params.tx_ref || params.transactionReference;
      const paymentMethod = params.payment_method || 'CHAPA';

      if (!txRef) {
        if (isMounted) {
          setError('Missing transaction reference.');
        }
        return;
      }

      try {
        setStatusMessage('Connecting to payment provider...');
        // 1. Verify with backend
        const verifyRes = await apiService.verifyPassengerPayment({
          transactionReference: txRef,
          paymentMethod,
        });

        if (!verifyRes.success) {
          console.warn('Verification note:', verifyRes.error);
        }

        setStatusMessage('Generating your official boarding passes...');

        // 2. Fetch the newly confirmed booking
        const bookingsRes = await apiService.getPassengerBookings();
        let confirmedBooking: any = null;

        if (bookingsRes.success && bookingsRes.data?.bookings?.length) {
          // Find the matching booking by tx_ref or take the newest one
          confirmedBooking =
            bookingsRes.data.bookings.find(
              (b: any) =>
                b.payment?.transactionReference === txRef ||
                b.transactionReference === txRef ||
                b.id === params.booking_id
            ) || bookingsRes.data.bookings[0];
        }

        if (isMounted) {
          if (confirmedBooking) {
            router.replace({
              pathname: '/passenger/ticket/[id]',
              params: {
                id: confirmedBooking.id,
                bookingData: JSON.stringify(confirmedBooking),
              },
            });
          } else {
            // Fall back to My Bookings list
            router.replace('/passenger/bookings');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Payment verification failed. Check My Bookings.');
        }
      }
    }

    void verifyAndNavigate();

    return () => {
      isMounted = false;
    };
  }, [params.tx_ref, params.transactionReference, params.payment_method, params.booking_id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {error ? (
          <>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Verification Status</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => router.replace('/passenger/bookings')}
            >
              <Text style={styles.btnText}>Go to My Bookings</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={GREEN} style={styles.loader} />
            <Text style={styles.title}>Payment Received!</Text>
            <Text style={styles.sub}>{statusMessage}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  loader: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: WHITE,
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f87171',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
  },
});

