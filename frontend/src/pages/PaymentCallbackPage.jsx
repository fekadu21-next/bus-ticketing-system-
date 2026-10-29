import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { verifyPaymentApi } from '@/api/trip.api';

export const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handlePaymentCallback = async () => {
      const txRef = searchParams.get('tx_ref');
      const callbackStatus = searchParams.get('status');
      const paymentMethod = searchParams.get('payment_method') || 'CHAPA';

      if (!txRef) {
        setStatus('error');
        setMessage('Invalid payment callback. Transaction reference not found.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (callbackStatus === 'cancelled' || callbackStatus === 'failed') {
        setStatus('error');
        setMessage('Payment was cancelled or failed. Please try again.');
        setTimeout(() => navigate('/payment'), 3000);
        return;
      }

      // Read persisted state from sessionStorage as fallback
      let savedState = {};
      try {
        const raw = sessionStorage.getItem('pending_booking_state');
        if (raw) savedState = JSON.parse(raw);
      } catch (err) {
        console.warn('Error reading saved booking state:', err);
      }

      try {
        // Verify payment with backend
        const response = await verifyPaymentApi({
          transactionReference: txRef,
          paymentMethod,
        });

        if (response.success && response.data) {
          setStatus('success');

          const backendData = response.data;
          const mergedBookingData = {
            ...backendData,
            tripData: backendData.tripData || savedState.tripData || {},
            passengerInfo: backendData.passengerInfo || savedState.passengerInfo || {},
            selectedSeats: backendData.selectedSeats || savedState.selectedSeats || [],
            payment: {
              ...backendData.payment,
              amount: backendData.payment?.amount || savedState.totalPrice || 0,
              paymentMethod: backendData.payment?.paymentMethod || paymentMethod,
              transactionReference: txRef,
            },
          };

          // Clean up sessionStorage
          try {
            sessionStorage.removeItem('pending_booking_state');
          } catch {}

          setTimeout(() => {
            navigate('/booking-confirmation', {
              state: {
                bookingData: mergedBookingData,
                tripData: mergedBookingData.tripData,
                selectedSeats: mergedBookingData.selectedSeats,
                passengerInfo: mergedBookingData.passengerInfo,
                paymentMethod: mergedBookingData.payment?.paymentMethod || paymentMethod,
                paymentAmount: mergedBookingData.payment?.amount || savedState.totalPrice,
              },
            });
          }, 1200);
        } else {
          throw new Error('Verification did not return success status');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('error');
        setMessage('Payment verification failed. Please contact support if payment was made.');
        setTimeout(() => navigate('/payment'), 3000);
      }
    };

    handlePaymentCallback();
  }, [searchParams, navigate]);

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_12px_32px_rgba(15,23,42,0.08)] p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 size={56} className="text-[#2563eb] mx-auto mb-4 animate-spin" />
            <h2 className="text-[22px] font-black text-slate-900 mb-2">Verifying Payment</h2>
            <p className="text-[13px] text-slate-500">Please wait while we confirm your payment and issue your digital ticket...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-[22px] font-black text-slate-900 mb-2">Payment Verified!</h2>
            <p className="text-[13px] text-slate-500">Your seat is confirmed. Redirecting to your boarding ticket...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-red-600" />
            </div>
            <h2 className="text-[22px] font-black text-slate-900 mb-2">Payment Verification Notice</h2>
            <p className="text-[13px] text-slate-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
