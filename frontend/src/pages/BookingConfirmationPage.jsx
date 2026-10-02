import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Download, Home, Ticket, MapPin, Calendar, Clock, User, Phone, Mail } from 'lucide-react';
import { formatEtb, formatPrettyDate } from '@/data/dummyTrips';

export const BookingConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tripData = location.state?.tripData || {};
  const selectedSeats = location.state?.selectedSeats || [];
  const passengerInfo = location.state?.passengerInfo || {};
  const paymentMethod = location.state?.paymentMethod || 'card';
  const paymentAmount = location.state?.paymentAmount || 0;

  const bookingId = 'BT' + Math.random().toString(36).substr(2, 9).toUpperCase();

  const handleDownloadTicket = () => {
    alert('Ticket download functionality would be implemented here');
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800 pb-12">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/crops/detail_banner.jpg" alt="" className="w-full h-full object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/88 via-[#0b2a4a]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90">
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <h1 className="mt-3 text-[32px] sm:text-[40px] font-black text-white tracking-tight">Booking Confirmed!</h1>
          <p className="mt-1 text-[13px] text-white/80">Your ticket has been successfully booked.</p>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 -mt-8 space-y-4 relative z-20">
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-6 sm:p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-[#22c55e]" />
          </div>
          <h2 className="text-[28px] font-black text-slate-900 mb-2">Thank You for Your Booking!</h2>
          <p className="text-[14px] text-slate-600 mb-4">Your booking has been confirmed successfully.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f0fdf4] rounded-full border border-green-200">
            <Ticket size={16} className="text-green-600" />
            <span className="text-[13px] font-semibold text-green-700">Booking ID: {bookingId}</span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <h2 className="text-[18px] font-extrabold text-slate-900 mb-5">Ticket Details</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-slate-400">Route</p>
                  <p className="text-[15px] font-bold text-slate-900">{tripData.from} → {tripData.to}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-slate-400">Date</p>
                  <p className="text-[15px] font-bold text-slate-900">{formatPrettyDate(tripData.date)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-slate-400">Departure Time</p>
                  <p className="text-[15px] font-bold text-slate-900">{tripData.departureTime}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Ticket size={18} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-slate-400">Seat Numbers</p>
                  <p className="text-[15px] font-bold text-slate-900">{selectedSeats.join(', ')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={18} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-slate-400">Passenger Name</p>
                  <p className="text-[15px] font-bold text-slate-900">{passengerInfo.firstName} {passengerInfo.lastName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-slate-400">Phone Number</p>
                  <p className="text-[15px] font-bold text-slate-900">{passengerInfo.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-slate-400">Email</p>
                  <p className="text-[15px] font-bold text-slate-900">{passengerInfo.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#2563eb] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-slate-400">Pickup Location</p>
                  <p className="text-[15px] font-bold text-slate-900">{passengerInfo.pickupLocation}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-semibold text-slate-700">Total Amount Paid</span>
              <span className="text-[28px] font-black text-[#2563eb]">{formatEtb(paymentAmount)}</span>
            </div>
            <p className="text-[12px] text-slate-500 mt-1">Payment Method: {paymentMethod === 'card' ? 'Credit/Debit Card' : 'Mobile Money'}</p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">Important Information</h2>
          <ul className="space-y-3 text-[13px] text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Please arrive at the pickup location at least 30 minutes before departure time.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Carry a valid ID card for verification at the boarding point.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Your e-ticket has been sent to your registered email address.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>For any changes or cancellations, please contact our support team.</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleDownloadTicket}
            className="flex-1 h-12 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download Ticket
          </button>
          <button
            onClick={handleReturnHome}
            className="flex-1 h-12 rounded-full border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
