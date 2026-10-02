import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Ticket, CheckCircle, XCircle, ArrowRight, Download, X, User, Phone, Mail } from 'lucide-react';
import { formatEtb, formatPrettyDate } from '@/data/dummyTrips';

export const MyBookingsPage = () => {
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const dummyBookings = [
    {
      id: 'BT123456789',
      from: 'Addis Ababa',
      to: 'Bahirdar',
      date: '2024-10-15',
      departureTime: '08:00',
      arrivalTime: '14:30',
      seats: ['A1', 'A2'],
      price: 850,
      status: 'upcoming',
      operator: 'Selam Bus',
      bookingDate: '2024-09-28',
      passengerName: 'Fekadu Asafew',
      passengerEmail: 'fekaduasafew57@gmail.com',
      passengerPhone: '0945382096',
      pickupLocation: 'Meskel Square',
      dropoffLocation: 'Bahirdar Bus Station',
    },
    {
      id: 'BT987654321',
      from: 'Addis Ababa',
      to: 'Hawassa',
      date: '2024-09-20',
      departureTime: '06:30',
      arrivalTime: '12:00',
      seats: ['B3'],
      price: 650,
      status: 'completed',
      operator: 'Ethio Bus',
      bookingDate: '2024-09-15',
      passengerName: 'Fekadu Asafew',
      passengerEmail: 'fekaduasafew57@gmail.com',
      passengerPhone: '0945382096',
      pickupLocation: 'Bole Airport',
      dropoffLocation: 'Hawassa Bus Station',
    },
    {
      id: 'BT456789123',
      from: 'Bahir Dar',
      to: 'Gondar',
      date: '2024-09-10',
      departureTime: '09:00',
      arrivalTime: '13:00',
      seats: ['C1', 'C2', 'C3'],
      price: 450,
      status: 'completed',
      operator: 'Anbessa Bus',
      bookingDate: '2024-09-05',
      passengerName: 'Fekadu Asafew',
      passengerEmail: 'fekaduasafew57@gmail.com',
      passengerPhone: '0945382096',
      pickupLocation: 'Bahir Dar Terminal',
      dropoffLocation: 'Gondar Bus Station',
    },
    {
      id: 'BT789123456',
      from: 'Addis Ababa',
      to: 'Mekelle',
      date: '2024-11-01',
      departureTime: '07:00',
      arrivalTime: '16:00',
      seats: ['D1'],
      price: 1200,
      status: 'upcoming',
      operator: 'Selam Bus',
      bookingDate: '2024-09-28',
      passengerName: 'Fekadu Asafew',
      passengerEmail: 'fekaduasafew57@gmail.com',
      passengerPhone: '0945382096',
      pickupLocation: 'Meskel Square',
      dropoffLocation: 'Mekelle Bus Station',
    },
    {
      id: 'BT321654987',
      from: 'Dire Dawa',
      to: 'Addis Ababa',
      date: '2024-08-25',
      departureTime: '10:00',
      arrivalTime: '15:30',
      seats: ['E1', 'E2'],
      price: 550,
      status: 'cancelled',
      operator: 'Ethio Bus',
      bookingDate: '2024-08-20',
      passengerName: 'Fekadu Asafew',
      passengerEmail: 'fekaduasafew57@gmail.com',
      passengerPhone: '0945382096',
      pickupLocation: 'Dire Dawa Terminal',
      dropoffLocation: 'Addis Ababa Terminal',
    },
  ];

  const filteredBookings = filter === 'all' 
    ? dummyBookings 
    : dummyBookings.filter(booking => booking.status === filter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
            <CheckCircle size={12} />
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <CheckCircle size={12} />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
            <XCircle size={12} />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownloadTicket = (bookingId) => {
    alert(`Downloading ticket for booking ${bookingId}`);
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseDetails = () => {
    setSelectedBooking(null);
  };

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800 pb-12">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/crops/detail_banner.jpg" alt="" className="w-full h-full object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/88 via-[#0b2a4a]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90">
            <ArrowRight size={14} className="rotate-180" />
            Back to Dashboard
          </Link>
          <h1 className="mt-3 text-[32px] sm:text-[40px] font-black text-white tracking-tight">My Bookings</h1>
          <p className="mt-1 text-[13px] text-white/80">View all your past and upcoming bus bookings.</p>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 -mt-8 space-y-4 relative z-20">
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-[18px] font-extrabold text-slate-900">Booking History</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                  filter === 'all'
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                  filter === 'upcoming'
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                  filter === 'completed'
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                  filter === 'cancelled'
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Ticket size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-[14px] text-slate-500">No bookings found for this filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-[#f8fafc] rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[12px] font-semibold text-slate-500">Booking ID: {booking.id}</span>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={16} className="text-[#2563eb]" />
                        <span className="text-[15px] font-bold text-slate-900">
                          {booking.from} → {booking.to}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-slate-600">{formatPrettyDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-slate-600">{booking.departureTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket size={14} className="text-slate-400" />
                          <span className="text-slate-600">Seats: {booking.seats.join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Operator:</span>
                          <span className="text-slate-600">{booking.operator}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:text-right">
                      <div>
                        <p className="text-[11px] text-slate-400">Total Paid</p>
                        <p className="text-[20px] font-black text-slate-900">{formatEtb(booking.price)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(booking)}
                          className="h-9 px-4 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-[12px] font-semibold inline-flex items-center gap-1.5"
                        >
                          See Details
                        </button>
                        {booking.status === 'upcoming' && (
                          <button
                            onClick={() => handleDownloadTicket(booking.id)}
                            className="h-9 px-4 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
                          >
                            <Download size={14} />
                            Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Booking Details</h2>
              <button
                onClick={handleCloseDetails}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Booking ID & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Booking ID</p>
                  <p className="text-lg font-bold text-slate-900">{selectedBooking.id}</p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              {/* Route Information */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={18} className="text-[#2563eb]" />
                  <span className="text-lg font-bold text-slate-900">
                    {selectedBooking.from} → {selectedBooking.to}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Date</p>
                    <p className="font-semibold text-slate-900">{formatPrettyDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Departure Time</p>
                    <p className="font-semibold text-slate-900">{selectedBooking.departureTime}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Arrival Time</p>
                    <p className="font-semibold text-slate-900">{selectedBooking.arrivalTime}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Operator</p>
                    <p className="font-semibold text-slate-900">{selectedBooking.operator}</p>
                  </div>
                </div>
              </div>

              {/* Passenger Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <User size={18} className="text-[#2563eb]" />
                  Passenger Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Name</p>
                      <p className="font-semibold text-slate-900">{selectedBooking.passengerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-semibold text-slate-900">{selectedBooking.passengerEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="font-semibold text-slate-900">{selectedBooking.passengerPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat & Location Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Ticket size={18} className="text-[#2563eb]" />
                  Seat & Location
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Ticket size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Seat Numbers</p>
                      <p className="font-semibold text-slate-900">{selectedBooking.seats.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Pickup Location</p>
                      <p className="font-semibold text-slate-900">{selectedBooking.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Dropoff Location</p>
                      <p className="font-semibold text-slate-900">{selectedBooking.dropoffLocation}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Total Amount Paid</p>
                    <p className="text-xs text-slate-500">Booking Date: {formatPrettyDate(selectedBooking.bookingDate)}</p>
                  </div>
                  <p className="text-2xl font-black text-[#2563eb]">{formatEtb(selectedBooking.price)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseDetails}
                  className="flex-1 h-11 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold"
                >
                  Close
                </button>
                {selectedBooking.status === 'upcoming' && (
                  <button
                    onClick={() => handleDownloadTicket(selectedBooking.id)}
                    className="flex-1 h-11 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
