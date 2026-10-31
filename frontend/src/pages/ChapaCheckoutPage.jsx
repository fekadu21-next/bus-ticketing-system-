import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  CreditCard,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Building2,
  Zap,
} from 'lucide-react';

export const ChapaCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Retrieve parameters from URL or sessionStorage fallback
  const txRefFromUrl = searchParams.get('tx_ref') || '';
  const amountFromUrl = searchParams.get('amount') || '';
  const emailFromUrl = searchParams.get('email') || '';
  const nameFromUrl = searchParams.get('name') || '';

  const [savedBookingState, setSavedBookingState] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pending_booking_state');
      if (raw) {
        setSavedBookingState(JSON.parse(raw));
      }
    } catch (err) {
      console.warn('Could not read pending_booking_state:', err);
    }
  }, []);

  const txRef = txRefFromUrl || savedBookingState?.transactionReference || `TX-CHAPA-${Date.now()}`;
  const amount = Number(amountFromUrl || savedBookingState?.totalPrice || 1200);
  const initialEmail = emailFromUrl || savedBookingState?.passengerInfo?.email || 'passenger@gmail.com';
  const initialName = nameFromUrl || savedBookingState?.passengerInfo?.fullName || 'Valued Passenger';

  const tripData = savedBookingState?.tripData || {};
  const selectedSeats = savedBookingState?.selectedSeats || [];
  const passengerInfo = savedBookingState?.passengerInfo || {};

  // Form states
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'mobile' | 'instant'
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState(initialName);
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [mobileProvider, setMobileProvider] = useState('telebirr');
  const [mobilePhone, setMobilePhone] = useState('0911223344');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0); // 0 = idle, 1 = connecting, 2 = authorizing, 3 = approved
  const [error, setError] = useState('');

  // 15-minute countdown timer
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const handleAutofillCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvv('123');
    setCardHolder(initialName);
    setError('');
  };

  const handleSimulatePayment = (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsProcessing(true);
    setProcessStep(1);

    // Multi-stage realistic simulated gateway authorization
    setTimeout(() => {
      setProcessStep(2);
      setTimeout(() => {
        setProcessStep(3);
        setTimeout(() => {
          // Redirect to payment callback with success
          navigate(
            `/payment/callback?tx_ref=${encodeURIComponent(txRef)}&status=success&payment_method=CHAPA`
          );
        }, 1100);
      }, 1200);
    }, 1000);
  };

  const handleCancelPayment = () => {
    if (window.confirm('Are you sure you want to cancel this payment?')) {
      navigate(
        `/payment/callback?tx_ref=${encodeURIComponent(txRef)}&status=cancelled&payment_method=CHAPA`
      );
    }
  };

  const origin = tripData.from || tripData.origin || tripData.route?.origin || 'Addis Ababa';
  const destination = tripData.to || tripData.destination || tripData.route?.destination || 'Destination';
  const departureDate = tripData.date || tripData.departureDate || (tripData.departureTime ? tripData.departureTime.split('T')[0] : 'Today');

  return (
    <div className="min-h-screen bg-[#f3f7f5] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-[#00c067] selection:text-white transition-colors">
      {/* Top Chapa Brand Header */}
      <header className="bg-[#0b241b] text-white shadow-md border-b border-[#143d2f]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Chapa Logo Badge */}
            <div className="w-10 h-10 rounded-xl bg-[#00c067] shadow-sm flex items-center justify-center font-black text-white text-lg tracking-tight">
              ch
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-black tracking-tight text-white">chapa</span>
                <span className="text-[10px] font-bold bg-[#00c067]/20 border border-[#00c067]/40 text-[#4ade80] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Sandbox Checkout
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/80 flex items-center gap-1">
                <span>Official Ethiopian Payment Gateway</span>
                <span>•</span>
                <span>Test Environment</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-emerald-300">
            <Clock size={14} className="text-[#4ade80]" />
            <span>Session: {formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Order & Merchant Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,192,103,0.06)] p-5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Payment Summary
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> PCI-DSS Level 1
                </span>
              </div>

              <div className="mt-4">
                <p className="text-xs text-slate-500 font-medium">Total Amount</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-[#00c067] tracking-tight">
                    {amount.toLocaleString()}
                  </span>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-300">ETB</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Merchant</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Ethio Bus Ticketing System
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Transaction Ref</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[180px]">
                    {txRef}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Route</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {origin} → {destination}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Departure</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{departureDate}</span>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Seats</span>
                    <span className="font-extrabold text-[#00c067] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      {selectedSeats.map((s) => `#${s}`).join(', ')} ({selectedSeats.length})
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Passenger</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {passengerInfo?.fullName || initialName}
                  </span>
                </div>
              </div>
            </div>

            {/* Test Mode Info Banner */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-200 flex gap-3 items-start">
              <Sparkles size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-100">Chapa Test Mode Activated</p>
                <p className="mt-1 text-amber-700 dark:text-amber-300 leading-relaxed text-[11px]">
                  No real money will be charged. This environment allows end-to-end verification of bus ticket issuance and booking confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Methods Form */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,192,103,0.06)] p-5 sm:p-6 transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Select Payment Method
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose a simulated payment method to test checkout
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'card'
                      ? 'bg-white dark:bg-slate-700 text-[#00c067] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CreditCard size={15} />
                  <span>Debit/Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('mobile')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'mobile'
                      ? 'bg-white dark:bg-slate-700 text-[#00c067] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone size={15} />
                  <span>Wallets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('instant')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'instant'
                      ? 'bg-white dark:bg-slate-700 text-[#00c067] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Zap size={15} />
                  <span>1-Click Test</span>
                </button>
              </div>

              {/* Tab 1: Card Input */}
              {activeTab === 'card' && (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Test Cards (Visa / Mastercard)
                    </span>
                    <button
                      type="button"
                      onClick={handleAutofillCard}
                      className="text-xs font-bold text-[#00c067] hover:underline flex items-center gap-1"
                    >
                      <Sparkles size={12} /> Auto-fill Demo Card
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00c067] focus:border-transparent transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                        <span>VISA</span>
                        <span>•</span>
                        <span>MC</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00c067] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00c067] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Passenger Name"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00c067] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Mobile Money Wallets */}
              {activeTab === 'mobile' && (
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Select Mobile Money Provider
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'telebirr', name: 'Telebirr', badge: 'Ethio Telecom' },
                        { id: 'cbebirr', name: 'CBEBirr', badge: 'Commercial Bank' },
                        { id: 'awashbirr', name: 'AwashBirr', badge: 'Awash Bank' },
                        { id: 'ebirr', name: 'Coopay-Ebirr', badge: 'Coop Bank' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMobileProvider(item.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            mobileProvider === item.id
                              ? 'border-[#00c067] bg-emerald-50/60 dark:bg-emerald-950/30'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{item.badge}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Account / Phone Number
                    </label>
                    <input
                      type="text"
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      placeholder="0911 223 344"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00c067] focus:border-transparent transition-all"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Simulated OTP/USSD authorization will auto-approve in test mode.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Instant 1-Click Test */}
              {activeTab === 'instant' && (
                <div className="mt-5 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#00c067] text-white flex items-center justify-center mx-auto shadow-md">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Instant 1-Click Test Simulation
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Instantly simulate successful authorization without filling any test forms. Verifies with your backend and issues tickets.
                  </p>
                </div>
              )}

              {/* Processing status box */}
              {isProcessing && (
                <div className="mt-5 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[#00c067] font-bold text-xs">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>
                      {processStep === 1 && 'Connecting to Chapa Sandbox API...'}
                      {processStep === 2 && 'Validating transaction reference & test limits...'}
                      {processStep === 3 && 'Payment Approved! Issuing digital boarding pass...'}
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 dark:bg-emerald-900/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00c067] h-full transition-all duration-500"
                      style={{
                        width: processStep === 1 ? '35%' : processStep === 2 ? '75%' : '100%',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 bg-[#00c067] hover:bg-[#00a859] disabled:bg-slate-400 text-white rounded-xl font-bold text-sm shadow-[0_4px_16px_rgba(0,192,103,0.3)] hover:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Authorizing Test Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Pay {amount.toLocaleString()} ETB (Test Simulation)</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelPayment}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-semibold text-xs transition-colors"
                >
                  Cancel & Return to Passenger Checkout
                </button>
              </div>

              {/* Security info */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Lock size={11} /> 256-bit TLS Encrypted
                </span>
                <span>•</span>
                <span>Chapa Financial Technologies</span>
                <span>•</span>
                <span>National Bank of Ethiopia</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChapaCheckoutPage;
