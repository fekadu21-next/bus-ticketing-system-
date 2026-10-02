import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CreditCard, Smartphone, CheckCircle, Shield, Lock } from 'lucide-react';
import { formatEtb } from '@/data/dummyTrips';

export const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tripData = location.state?.tripData || {};
  const selectedSeats = location.state?.selectedSeats || [];
  const passengerInfo = location.state?.passengerInfo || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [mobileData, setMobileData] = useState({
    phoneNumber: '',
    provider: 'telebirr',
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleMobileChange = (e) => {
    const { name, value } = e.target;
    setMobileData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validatePayment = () => {
    const newErrors = {};
    if (paymentMethod === 'card') {
      if (!cardData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      if (!cardData.cardName.trim()) newErrors.cardName = 'Cardholder name is required';
      if (!cardData.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
      if (!cardData.cvv.trim()) newErrors.cvv = 'CVV is required';
    } else {
      if (!mobileData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validatePayment();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      navigate('/booking-confirmation', {
        state: {
          tripData,
          selectedSeats,
          passengerInfo,
          paymentMethod,
          paymentAmount: tripData.price * selectedSeats.length,
        },
      });
    }, 2000);
  };

  const totalPrice = tripData.price * selectedSeats.length;

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
              <span className="text-[13px] text-slate-600">Trip</span>
              <span className="text-[13px] font-semibold text-slate-900">{tripData.from} → {tripData.to}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-600">Date</span>
              <span className="text-[13px] font-semibold text-slate-900">{tripData.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-600">Seats</span>
              <span className="text-[13px] font-semibold text-slate-900">{selectedSeats.join(', ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-600">Price per seat</span>
              <span className="text-[13px] font-semibold text-slate-900">{formatEtb(tripData.price)}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[14px] font-bold text-slate-700">Total Amount</span>
              <span className="text-[24px] font-black text-[#2563eb]">{formatEtb(totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <h2 className="text-[18px] font-extrabold text-slate-900 mb-5">Select Payment Method</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                paymentMethod === 'card'
                  ? 'border-[#2563eb] bg-[#eef4ff]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <CreditCard size={24} className={paymentMethod === 'card' ? 'text-[#2563eb]' : 'text-slate-400'} />
              <div className="text-left">
                <p className="text-[14px] font-bold text-slate-900">Credit/Debit Card</p>
                <p className="text-[11px] text-slate-500">Visa, Mastercard, Amex</p>
              </div>
              {paymentMethod === 'card' && <CheckCircle size={20} className="ml-auto text-[#2563eb]" />}
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('mobile')}
              className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                paymentMethod === 'mobile'
                  ? 'border-[#2563eb] bg-[#eef4ff]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Smartphone size={24} className={paymentMethod === 'mobile' ? 'text-[#2563eb]' : 'text-slate-400'} />
              <div className="text-left">
                <p className="text-[14px] font-bold text-slate-900">Mobile Money</p>
                <p className="text-[11px] text-slate-500">Telebirr, M-Pesa</p>
              </div>
              {paymentMethod === 'mobile' && <CheckCircle size={20} className="ml-auto text-[#2563eb]" />}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {paymentMethod === 'card' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Card Number *</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.cardNumber ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                  {errors.cardNumber && <p className="text-[11px] text-red-500 mt-1">{errors.cardNumber}</p>}
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Cardholder Name *</label>
                  <input
                    type="text"
                    name="cardName"
                    value={cardData.cardName}
                    onChange={handleCardChange}
                    placeholder="Name on card"
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.cardName ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                  {errors.cardName && <p className="text-[11px] text-red-500 mt-1">{errors.cardName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Expiry Date *</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardData.expiryDate}
                      onChange={handleCardChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.expiryDate ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                    />
                    {errors.expiryDate && <p className="text-[11px] text-red-500 mt-1">{errors.expiryDate}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">CVV *</label>
                    <input
                      type="text"
                      name="cvv"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                      placeholder="123"
                      maxLength={4}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.cvv ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                    />
                    {errors.cvv && <p className="text-[11px] text-red-500 mt-1">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Mobile Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={mobileData.phoneNumber}
                    onChange={handleMobileChange}
                    placeholder="2519XXXXXXXX"
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.phoneNumber ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                  {errors.phoneNumber && <p className="text-[11px] text-red-500 mt-1">{errors.phoneNumber}</p>}
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Payment Provider</label>
                  <select
                    name="provider"
                    value={mobileData.provider}
                    onChange={handleMobileChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                  >
                    <option value="telebirr">Telebirr</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="cbebirr">CBE Birr</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-6 p-3 bg-[#f0fdf4] rounded-lg border border-green-200">
              <Shield size={16} className="text-green-600" />
              <p className="text-[12px] text-green-700">
                Your payment is secured with 256-bit SSL encryption
              </p>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 h-11 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {formatEtb(totalPrice)}
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
