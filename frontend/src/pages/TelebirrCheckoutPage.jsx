import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Clock,
  QrCode,
  RefreshCw,
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';

export const TelebirrCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Retrieve parameters from URL or sessionStorage fallback
  const txRefFromUrl = searchParams.get('tx_ref') || '';
  const amountFromUrl = searchParams.get('amount') || '';
  const phoneFromUrl = searchParams.get('phone') || '';

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

  const txRef = txRefFromUrl || savedBookingState?.transactionReference || 'TX-BUS-PENDING';
  const amount = Number(amountFromUrl || savedBookingState?.totalPrice || 0);
  const initialPhone = phoneFromUrl || savedBookingState?.passengerInfo?.phone || '0911223344';

  const tripData = savedBookingState?.tripData || {};
  const selectedSeats = savedBookingState?.selectedSeats || [];
  const passengerInfo = savedBookingState?.passengerInfo || {};

  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('ussd'); // 'ussd' | 'qr'
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0); // 0 = idle, 1 = contacting, 2 = verifying, 3 = approved
  const [error, setError] = useState('');

  // 10-minute session countdown timer
  const [timeLeft, setTimeLeft] = useState(10 * 60);

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

  // Generate dynamic QR code
  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      try {
        const payload = JSON.stringify({
          app: 'telebirr',
          merchant: 'Ethio Bus Ticketing',
          tx_ref: txRef,
          amount,
          currency: 'ETB',
          timestamp: Date.now(),
        });

        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 1,
          color: {
            dark: '#005cb9', // Telebirr signature blue
            light: '#ffffff',
          },
        });
        if (isMounted) {
          setQrCodeDataUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate Telebirr QR code:', err);
      }
    };

    if (txRef) {
      generateQr();
    }
    return () => {
      isMounted = false;
    };
  }, [txRef, amount]);

  const handleCopyTxRef = () => {
    if (!txRef) return;
    navigator.clipboard.writeText(txRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handlePinBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setPin('');
  };

  const handleFillDemoPin = () => {
    setPin('1234');
    setError('');
  };

  const handleConfirmPayment = () => {
    if (activeTab === 'ussd' && pin.length < 4) {
      setError('Please enter your 4-digit Telebirr PIN (demo: 1234)');
      return;
    }

    setError('');
    setIsProcessing(true);
    setProcessStep(1);

    // Multi-stage simulated payment processing
    setTimeout(() => {
      setProcessStep(2);
      setTimeout(() => {
        setProcessStep(3);
        setTimeout(() => {
          // Redirect to payment callback with success
          navigate(
            `/payment/callback?tx_ref=${encodeURIComponent(txRef)}&status=success&payment_method=TELEBIRR`
          );
        }, 1200);
      }, 1400);
    }, 1200);
  };

  const handleCancelPayment = () => {
    if (window.confirm('Are you sure you want to cancel this Telebirr payment?')) {
      navigate(
        `/payment/callback?tx_ref=${encodeURIComponent(txRef)}&status=cancelled&payment_method=TELEBIRR`
      );
    }
  };

  const origin = tripData.from || tripData.origin || tripData.route?.origin || 'Addis Ababa';
  const destination = tripData.to || tripData.destination || tripData.route?.destination || 'Destination';
  const departureDate = tripData.date || tripData.departureDate || (tripData.departureTime ? tripData.departureTime.split('T')[0] : 'Today');

  return (
    <div className="min-h-screen bg-[#f0f4f9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-[#0072ce] selection:text-white transition-colors">
      {/* Top Telebirr / Ethio Telecom Brand Header */}
      <header className="bg-gradient-to-r from-[#004f9e] via-[#005cb9] to-[#0072ce] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Telebirr Logo Emblem */}
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-[#005cb9] text-xl tracking-tighter">
              <span className="text-[#005cb9]">tb</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-black tracking-tight text-white">telebirr</span>
                <span className="text-[10px] font-bold bg-[#8bc53f] text-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Hosted Checkout
                </span>
              </div>
              <p className="text-[11px] text-blue-100 flex items-center gap-1">
                <span>Ethio Telecom Secure Payment Gateway</span>
                <span>•</span>
                <span className="text-emerald-300 font-semibold">ቴሌብር</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full text-xs font-mono font-bold">
            <Clock size={14} className="text-amber-300" />
            <span>Session: {formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Order & Merchant Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,92,185,0.06)] p-5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Payment Summary
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> SSL Verified
                </span>
              </div>

              <div className="mt-4">
                <p className="text-xs text-slate-500 font-medium">Total Amount Due</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-[#005cb9] tracking-tight">
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

                {tripData.operator && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Bus Operator</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{tripData.operator}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Route</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {origin} → {destination}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Travel Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{departureDate}</span>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Selected Seats</span>
                    <span className="font-bold text-[#005cb9] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                      {selectedSeats.join(', ')}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Transaction Ref:</span>
                    <button
                      type="button"
                      onClick={handleCopyTxRef}
                      className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-300 hover:text-[#005cb9] dark:hover:text-blue-400 transition-colors"
                      title="Click to copy reference"
                    >
                      <span className="truncate max-w-[150px]">{txRef}</span>
                      {copied ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Mode / Sandbox Notice */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2.5">
                <Sparkles size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950 dark:text-amber-100">Telebirr Sandbox Simulator</p>
                  <p className="mt-0.5 text-amber-800 dark:text-amber-300 leading-relaxed text-[11px]">
                    This checkout environment simulates the official Ethio Telecom Telebirr Web Gateway.
                    Enter any 4-digit PIN (e.g. <b>1234</b>) or click &ldquo;Confirm Payment&rdquo; to complete your booking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Telebirr Payment UI */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,92,185,0.08)] overflow-hidden">
              {/* Payment Tab Selector */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ussd');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'ussd'
                      ? 'bg-white dark:bg-slate-800 text-[#005cb9] dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone size={16} />
                  <span>USSD / PIN Push</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('qr');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'qr'
                      ? 'bg-white dark:bg-slate-800 text-[#005cb9] dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <QrCode size={16} />
                  <span>Telebirr SuperApp QR</span>
                </button>
              </div>

              {/* Tab 1: USSD / PIN Push */}
              {activeTab === 'ussd' && (
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Telebirr Mobile Number (የቴሌብር ስልክ ቁጥር)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                        🇪🇹 +251
                      </div>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0911 223 344"
                        className="w-full pl-20 pr-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005cb9] focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Registered Ethio Telecom Telebirr account number
                    </p>
                  </div>

                  {/* 4-Digit Telebirr PIN Display */}
                  <div className="bg-[#f8fafc] dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Telebirr Wallet PIN (4 Digits)
                      </span>
                      <button
                        type="button"
                        onClick={handleFillDemoPin}
                        className="text-[11px] font-bold text-[#005cb9] dark:text-blue-400 hover:underline"
                      >
                        Auto-fill Demo PIN
                      </button>
                    </div>

                    {/* PIN Masked Dots */}
                    <div className="flex justify-center items-center gap-3 my-3">
                      {[0, 1, 2, 3].map((idx) => {
                        const filled = pin.length > idx;
                        return (
                          <div
                            key={idx}
                            className={`w-11 h-12 rounded-xl flex items-center justify-center text-xl font-black transition-all ${
                              filled
                                ? 'bg-[#005cb9] text-white shadow-sm scale-105'
                                : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                            }`}
                          >
                            {filled ? '•' : ''}
                          </div>
                        );
                      })}
                    </div>

                    {/* Numeric Keypad for Simulation */}
                    <div className="max-w-[260px] mx-auto grid grid-cols-3 gap-2 mt-4">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => handlePinInput(digit)}
                          disabled={isProcessing}
                          className="h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-[#005cb9] hover:text-[#005cb9] dark:hover:text-blue-400 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {digit}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleClearPin}
                        disabled={isProcessing}
                        className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePinInput('0')}
                        disabled={isProcessing}
                        className="h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-[#005cb9] hover:text-[#005cb9] dark:hover:text-blue-400 active:scale-95 transition-all disabled:opacity-50"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={handlePinBackspace}
                        disabled={isProcessing}
                        className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
                      >
                        ⌫
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: SuperApp QR Code */}
              {activeTab === 'qr' && (
                <div className="p-6 text-center space-y-4">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Scan with your <b>telebirr SuperApp</b> to approve payment directly from your smartphone
                  </p>

                  <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#005cb9]/30 inline-block shadow-sm">
                    {qrCodeDataUrl ? (
                      <div className="relative">
                        <img
                          src={qrCodeDataUrl}
                          alt="Telebirr Payment QR Code"
                          className="w-56 h-56 mx-auto rounded-lg"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-white shadow-md border-2 border-[#005cb9] flex items-center justify-center font-black text-[#005cb9] text-xs">
                            tb
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-56 h-56 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                        Generating QR Code...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>1. Open telebirr</span>
                    <span>→</span>
                    <span>2. Tap QR Scan</span>
                    <span>→</span>
                    <span>3. Approve {amount} ETB</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mx-6 mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Processing Overlay / Status */}
              {isProcessing && (
                <div className="mx-6 mb-5 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm font-black text-[#005cb9] dark:text-blue-400">
                    <RefreshCw size={18} className="animate-spin" />
                    {processStep === 1 && 'Connecting to Ethio Telecom Telebirr Gateway...'}
                    {processStep === 2 && 'Validating Telebirr Wallet & Authorizing Fare...'}
                    {processStep === 3 && 'Payment Approved! Issuing Your Digital Ticket...'}
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
                    <div
                      className="bg-[#005cb9] h-full transition-all duration-700 ease-out"
                      style={{
                        width: processStep === 1 ? '35%' : processStep === 2 ? '75%' : '100%',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="p-6 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#005cb9] to-[#0072ce] hover:from-[#004f9e] hover:to-[#005cb9] text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Processing Telebirr Transaction...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Pay {amount.toLocaleString()} ETB with Telebirr
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleCancelPayment}
                    disabled={isProcessing}
                    className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-colors disabled:opacity-40"
                  >
                    Cancel Transaction
                  </button>

                  <Link
                    to="/passenger-info"
                    state={{ tripData, selectedSeats, passengerInfo }}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 font-semibold"
                  >
                    <ArrowLeft size={13} />
                    Return to Booking
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Regulatory Notice */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#005cb9] dark:text-blue-400" />
            <span>Ethio Telecom • Telebirr Financial Services Regulatory Compliance</span>
          </div>
          <p>© 2026 Ethio Bus Ticketing System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TelebirrCheckoutPage;
