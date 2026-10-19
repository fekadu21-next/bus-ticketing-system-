import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CreditCard, Smartphone, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { initializePaymentApi } from '@/api/trip.api';
import { formatUserFullName } from '@/utils/userUtils';

// Simple ETB formatter
const formatEtb = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ETB';
  return `${amount.toLocaleString()} ETB`;
};

export const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, checkAuth } = useAuth();
  const tripData = location.state?.tripData || {};
  const selectedSeats = location.state?.selectedSeats || [];
  const passengerInfo = location.state?.passengerInfo || {};
  const newlyRegistered = location.state?.newlyRegistered || false;

  const [paymentMethod, setPaymentMethod] = useState('CHAPA');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Get price from various possible field names
  const price = Number(tripData.price || tripData.fare || tripData.total_fare || 0);
  const totalPrice = price * selectedSeats.length;

  // If user was just registered, refresh auth state
  useEffect(() => {
    if (newlyRegistered) {
      checkAuth();
    }
  }, [newlyRegistered, checkAuth]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      const paymentData = {
        tripId: tripData.id,
        seatNumbers: selectedSeats,
        amount: totalPrice,
        paymentMethod,
        passengerInfo,
      };

      // Persist pending booking state in session storage across redirects
      try {
        sessionStorage.setItem('pending_booking_state', JSON.stringify({
          tripData,
          selectedSeats,
          passengerInfo,
          paymentMethod,
          totalPrice,
        }));
      } catch (err) {
        console.warn('Could not save booking state to sessionStorage:', err);
      }

      const response = await initializePaymentApi(paymentData);

      if (response.success && response.data?.checkoutUrl) {
        const checkoutUrl = response.data.checkoutUrl;
        
        // Redirect to payment provider checkout
        window.location.href = checkoutUrl;
      } else {
        setError('Failed to initialize payment. Please try again.');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  // If no trip data, redirect back
  if (!tripData.id) {
    return (
      <div className="bg-[#f4f7fb] min-h-screen text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">No trip data found. Please select a trip first.</p>
          <Link to="/" className="text-blue-600 underline">Go to Home</Link>
        </div>
      </div>
    );
  }

  // Get trip display data
  const from = tripData.from || tripData.origin || tripData.route?.origin || 'Unknown';
  const to = tripData.to || tripData.destination || tripData.route?.destination || 'Unknown';
  const date = tripData.date || tripData.departureDate || tripData.departureTime?.split('T')[0] || 'Unknown';

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800 pb-12">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/crops/detail_banner.jpg" alt="" className="w-full h-full object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/88 via-[#0b2a4a]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Link to="/passenger-info" state={{ tripData, selectedSeats }} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90">
            <ArrowLeft size={14} />
            Back to Passenger Info
          </Link>
          <h1 className="mt-3 text-[32px] sm:text-[40px] font-black text-white tracking-tight">Payment</h1>
          <p className="mt-1 text-[13px] text-white/80">Complete your payment to confirm your booking.</p>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 -mt-8 space-y-4 relative z-20">
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">Booking Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-600">Passenger</span>
              <span className="text-[13px] font-semibold text-slate-900">
                {formatUserFullName(passengerInfo, 'Valued Passenger')}
              </span>
            </div>
            {passengerInfo?.phone && (
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-600">Phone Number</span>
                <span className="text-[13px] font-semibold text-slate-900">{passengerInfo.phone}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-600">Trip</span>
              <span className="text-[13px] font-semibold text-slate-900">{from} → {to}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-600">Date</span>
              <span className="text-[13px] font-semibold text-slate-900">{date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-600">Seats</span>
              <span className="text-[13px] font-semibold text-slate-900">{selectedSeats.join(', ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-600">Price per seat</span>
              <span className="text-[13px] font-semibold text-slate-900">{formatEtb(price)}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[14px] font-bold text-slate-700">Total Amount</span>
              <span className="text-[24px] font-black text-[#2563eb]">{formatEtb(totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <h2 className="text-[18px] font-extrabold text-slate-900 mb-5">Select Payment Method</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setPaymentMethod('CHAPA')}
              className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all text-left ${
                paymentMethod === 'CHAPA'
                  ? 'border-[#2563eb] dark:border-blue-500 bg-[#eef4ff] dark:bg-blue-950/40'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <CreditCard size={24} className={paymentMethod === 'CHAPA' ? 'text-[#2563eb] dark:text-blue-400' : 'text-slate-400'} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white">Chapa (Hosted Gateway)</p>
                  <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">Test Credentials</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Redirects to Chapa checkout with test payment methods</p>
              </div>
              {paymentMethod === 'CHAPA' && <CheckCircle size={20} className="ml-auto text-[#2563eb] dark:text-blue-400 flex-shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('TELEBIRR')}
              className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all text-left ${
                paymentMethod === 'TELEBIRR'
                  ? 'border-[#2563eb] dark:border-blue-500 bg-[#eef4ff] dark:bg-blue-950/40'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <Smartphone size={24} className={paymentMethod === 'TELEBIRR' ? 'text-[#2563eb] dark:text-blue-400' : 'text-slate-400'} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white">Telebirr (Mobile Money)</p>
                  <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Real</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ethio Telecom Telebirr USSD & App PIN payment</p>
              </div>
              {paymentMethod === 'TELEBIRR' && <CheckCircle size={20} className="ml-auto text-[#2563eb] dark:text-blue-400 flex-shrink-0" />}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-6 p-3 bg-[#f0fdf4] dark:bg-emerald-950/30 rounded-lg border border-green-200 dark:border-emerald-800/60">
            <Shield size={16} className="text-green-600 dark:text-emerald-400" />
            <p className="text-[12px] text-green-700 dark:text-emerald-300">
              Your payment is secured with 256-bit SSL encryption
            </p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <button
              type="button"
              onClick={handlePaymentSubmit}
              disabled={isProcessing}
              className="flex-1 h-11 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-slate-400 text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatEtb(totalPrice)} with {paymentMethod === 'CHAPA' ? 'Chapa' : 'Telebirr'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
            <Link
              to="/passenger-info"
              state={{ tripData, selectedSeats }}
              className="h-11 px-6 rounded-full border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
